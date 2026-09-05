/**
 * Payment & Referral System Tests
 * Tests: updatePaymentStatus with referral bonus, 2-level referral rewards
 */

const { stores, resetStores, mockModels } = require('./setup.js');

// Load the controller (mocking is handled by setup.js)
const paymentController = require('../controllers/paymentController.js');

function mockReq(body = {}, params = {}, query = {}, user = null) {
  return { body, params, query, user, files: null, header: () => null };
}

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; },
  };
}

async function createUserWithReferral(email, referredBy = null, isCompany = false) {
  return await mockModels.User.create({
    full_name: email.split('@')[0],
    email,
    password: 'hashed',
    role: 'buyer',
    status: 'active',
    referral_code: `GN-${email.split('@')[0].toUpperCase().slice(0, 6)}`,
    is_referrer: true,
    is_company: isCompany,
    wallet_balance: 0,
    referral_earnings: 0,
    referred_by: referredBy,
  });
}

// ---- Tests ----

describe('Payment Controller \u2014 Referral Bonus', () => {
  beforeEach(() => resetStores());

  it('should reward referrer when payment is approved', async () => {
    const referrer = await createUserWithReferral('referrer@test.com');
    const customer = await createUserWithReferral('customer@test.com', referrer.id);

    const payment = await mockModels.Payment.create({
      customer_name: 'Customer',
      customer_email: 'customer@test.com',
      total_price: 1000,
      payment_status: 'Pending',
      referral_code: referrer.referral_code,
    });

    const req = mockReq({ payment_status: 'Approved' }, { payment_id: payment.id });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);

    expect(res.statusCode).toBe(200);
    const updatedReferrer = await mockModels.User.findByPk(referrer.id);
    expect(parseFloat(updatedReferrer.wallet_balance)).toBe(5); // individual bonus
  });

  it('should reward company referrer with 10 ETB', async () => {
    const referrer = await createUserWithReferral('company@test.com', null, true);
    const payment = await mockModels.Payment.create({
      customer_name: 'Cust',
      customer_email: 'cust@test.com',
      total_price: 500,
      payment_status: 'Pending',
      referral_code: referrer.referral_code,
    });

    const req = mockReq({ payment_status: 'Approved' }, { payment_id: payment.id });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);

    const updatedReferrer = await mockModels.User.findByPk(referrer.id);
    expect(parseFloat(updatedReferrer.wallet_balance)).toBe(10); // company bonus
  });

  it('should reward 2nd-level referrer', async () => {
    // Chain: grandparent -> parent -> customer
    const grandparent = await createUserWithReferral('grandparent@test.com');
    const parent = await createUserWithReferral('parent@test.com', grandparent.id);
    const payment = await mockModels.Payment.create({
      customer_name: 'Cust',
      customer_email: 'cust@test.com',
      total_price: 200,
      payment_status: 'Pending',
      referral_code: parent.referral_code,
    });

    const req = mockReq({ payment_status: 'Completed' }, { payment_id: payment.id });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);

    const updatedParent = await mockModels.User.findByPk(parent.id);
    const updatedGrandparent = await mockModels.User.findByPk(grandparent.id);
    expect(parseFloat(updatedParent.wallet_balance)).toBe(5);
    expect(parseFloat(updatedGrandparent.wallet_balance)).toBe(5);
  });

  it('should NOT re-reward on duplicate status update', async () => {
    const referrer = await createUserWithReferral('ref@test.com');
    const payment = await mockModels.Payment.create({
      customer_name: 'C',
      customer_email: 'c@test.com',
      total_price: 100,
      payment_status: 'Approved',
      referral_code: referrer.referral_code,
    });

    // Try to update to Approved again
    const req = mockReq({ payment_status: 'Approved' }, { payment_id: payment.id });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);

    const updatedReferrer = await mockModels.User.findByPk(referrer.id);
    expect(parseFloat(updatedReferrer.wallet_balance)).toBe(0); // no double reward
  });

  it('should not reward when payment has no referral_code', async () => {
    const payment = await mockModels.Payment.create({
      customer_name: 'C',
      customer_email: 'c@test.com',
      total_price: 100,
      payment_status: 'Pending',
      referral_code: null,
    });

    const req = mockReq({ payment_status: 'Approved' }, { payment_id: payment.id });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('should reject invalid payment status', async () => {
    const req = mockReq({ payment_status: 'RandomStatus' }, { payment_id: 1 });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('should return 404 for non-existent payment', async () => {
    const req = mockReq({ payment_status: 'Approved' }, { payment_id: 99999 });
    const res = mockRes();
    await paymentController.updatePaymentStatus(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('Payment Controller \u2014 Order History', () => {
  beforeEach(async () => {
    resetStores();
    await mockModels.Payment.create({
      customer_name: 'Alice',
      customer_email: 'alice@test.com',
      total_price: 100,
      payment_status: 'Approved',
    });
    await mockModels.Payment.create({
      customer_name: 'Bob',
      customer_email: 'bob@test.com',
      total_price: 200,
      payment_status: 'Pending',
    });
  });

  it('should get order history by customer email', async () => {
    const req = mockReq({}, {}, { customer_email: 'alice@test.com' });
    const res = mockRes();
    await paymentController.getOrderHistory(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].customer_email).toBe('alice@test.com');
  });

  it('should return 400 without email or guest_id', async () => {
    const req = mockReq({}, {}, {});
    const res = mockRes();
    await paymentController.getOrderHistory(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('should return 404 when no orders found', async () => {
    const req = mockReq({}, {}, { customer_email: 'nobody@test.com' });
    const res = mockRes();
    await paymentController.getOrderHistory(req, res);
    expect(res.statusCode).toBe(404);
  });
});
