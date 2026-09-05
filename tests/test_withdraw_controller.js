/**
 * Withdraw Controller Tests
 * Tests: requestWithdraw, getMyWithdrawals, getAllWithdrawals, updateWithdrawalStatus
 */

const { stores, resetStores, mockModels } = require('./setup.js');

// Load the controller (mocking is handled by setup.js)
const withdrawController = require('../controllers/withdrawController.js');

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

async function createUser(balance = 500) {
  return await mockModels.User.create({
    full_name: 'Wallet User',
    email: `wallet${Date.now()}@test.com`,
    password: 'hashed',
    role: 'buyer',
    status: 'active',
    referral_code: `GN-W${Date.now().toString().slice(-6)}`,
    is_referrer: true,
    wallet_balance: balance,
    referral_earnings: 0,
  });
}

// ---- Tests ----

describe('Withdraw Controller \u2014 Request Withdrawal', () => {
  beforeEach(() => resetStores());

  it('should create a withdrawal request', async () => {
    const user = await createUser(500);
    const req = mockReq({ amount: 200 }, {}, {}, user);
    const res = mockRes();

    await withdrawController.requestWithdraw(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.withdrawal.amount).toBe(200);
    expect(res.body.withdrawal.status).toBe('Pending');
    expect(res.body.withdrawal.user_id).toBe(user.id);
  });

  it('should reject withdrawal below minimum (100 ETB)', async () => {
    const user = await createUser(500);
    const req = mockReq({ amount: 50 }, {}, {}, user);
    const res = mockRes();

    await withdrawController.requestWithdraw(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Minimum');
  });

  it('should reject withdrawal exceeding wallet balance', async () => {
    const user = await createUser(100);
    const req = mockReq({ amount: 500 }, {}, {}, user);
    const res = mockRes();

    await withdrawController.requestWithdraw(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Insufficient');
  });

  it('should reject if user already has pending withdrawal', async () => {
    const user = await createUser(500);
    // First withdrawal
    await withdrawController.requestWithdraw(mockReq({ amount: 200 }, {}, {}, user), mockRes());
    // Second withdrawal attempt
    const req = mockReq({ amount: 100 }, {}, {}, user);
    const res = mockRes();
    await withdrawController.requestWithdraw(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('pending withdrawal');
  });

  it('should reject non-existent user', async () => {
    const fakeUser = { id: 99999, wallet_balance: 500 };
    const req = mockReq({ amount: 200 }, {}, {}, fakeUser);
    const res = mockRes();
    await withdrawController.requestWithdraw(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('Withdraw Controller \u2014 Get My Withdrawals', () => {
  beforeEach(() => resetStores());

  it('should return user withdrawal history', async () => {
    const user = await createUser(1000);
    await withdrawController.requestWithdraw(mockReq({ amount: 200 }, {}, {}, user), mockRes());
    await withdrawController.requestWithdraw(mockReq({ amount: 150 }, {}, {}, user), mockRes());

    // Approve first so we can make a second... actually they both can be pending
    // Let's just check with one
    const req = mockReq({}, {}, {}, user);
    const res = mockRes();
    await withdrawController.getMyWithdrawals(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.withdrawals).toHaveLength(1);
  });

  it('should return empty for user with no withdrawals', async () => {
    const user = await createUser(500);
    const req = mockReq({}, {}, {}, user);
    const res = mockRes();
    await withdrawController.getMyWithdrawals(req, res);
    expect(res.body.withdrawals).toHaveLength(0);
  });
});

describe('Withdraw Controller \u2014 Admin: GetAllWithdrawals', () => {
  beforeEach(async () => {
    resetStores();
    const u1 = await createUser(1000);
    const u2 = await createUser(2000);
    await mockModels.WithdrawRequest.create({ user_id: u1.id, amount: 200, status: 'Pending' });
    await mockModels.WithdrawRequest.create({ user_id: u2.id, amount: 500, status: 'Approved' });
    await mockModels.WithdrawRequest.create({ user_id: u1.id, amount: 300, status: 'Declined' });
  });

  it('should return all withdrawals with stats', async () => {
    const req = mockReq({}, {}, {});
    const res = mockRes();
    await withdrawController.getAllWithdrawals(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.withdrawals).toHaveLength(3);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.pending_withdrawals).toBe(200);
    expect(res.body.stats.approved_withdrawals).toBe(500);
  });

  it('should filter by status', async () => {
    const req = mockReq({}, {}, { status: 'Pending' });
    const res = mockRes();
    await withdrawController.getAllWithdrawals(req, res);
    expect(res.body.withdrawals).toHaveLength(1);
    expect(res.body.withdrawals[0].status).toBe('Pending');
  });
});

describe('Withdraw Controller \u2014 Admin: Update Withdrawal Status', () => {
  beforeEach(() => resetStores());

  it('should approve a pending withdrawal and deduct from wallet', async () => {
    const user = await createUser(500);
    const withdrawal = await mockModels.WithdrawRequest.create({ user_id: user.id, amount: 200, status: 'Pending' });

    const req = mockReq({ status: 'Approved' }, { id: withdrawal.id });
    const res = mockRes();
    await withdrawController.updateWithdrawalStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.withdrawal.status).toBe('Approved');
    // Check wallet was deducted
    const updatedUser = await mockModels.User.findByPk(user.id);
    expect(parseFloat(updatedUser.wallet_balance)).toBe(300); // 500 - 200
  });

  it('should decline a pending withdrawal without deducting', async () => {
    const user = await createUser(500);
    const withdrawal = await mockModels.WithdrawRequest.create({ user_id: user.id, amount: 200, status: 'Pending' });

    const req = mockReq({ status: 'Declined' }, { id: withdrawal.id });
    const res = mockRes();
    await withdrawController.updateWithdrawalStatus(req, res);

    expect(res.body.withdrawal.status).toBe('Declined');
    const updatedUser = await mockModels.User.findByPk(user.id);
    expect(parseFloat(updatedUser.wallet_balance)).toBe(500); // unchanged
  });

  it('should reject invalid status', async () => {
    const req = mockReq({ status: 'Cancelled' }, { id: 1 });
    const res = mockRes();
    await withdrawController.updateWithdrawalStatus(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('should reject double-processing an approved withdrawal', async () => {
    const user = await createUser(500);
    const withdrawal = await mockModels.WithdrawRequest.create({ user_id: user.id, amount: 200, status: 'Approved' });

    const req = mockReq({ status: 'Declined' }, { id: withdrawal.id });
    const res = mockRes();
    await withdrawController.updateWithdrawalStatus(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already');
  });

  it('should return 404 for non-existent withdrawal', async () => {
    const req = mockReq({ status: 'Approved' }, { id: 99999 });
    const res = mockRes();
    await withdrawController.updateWithdrawalStatus(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should reject approval if user has insufficient balance', async () => {
    const user = await createUser(100);
    const withdrawal = await mockModels.WithdrawRequest.create({ user_id: user.id, amount: 500, status: 'Pending' });

    const req = mockReq({ status: 'Approved' }, { id: withdrawal.id });
    const res = mockRes();
    await withdrawController.updateWithdrawalStatus(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('insufficient');
  });
});
