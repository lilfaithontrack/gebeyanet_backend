/**
 * User Controller Tests
 * Tests: registerUser, loginUser, getProfile, upgradeToSeller,
 *        getAllUsers (with filters/pagination), updateUserStatus, getReferralStats
 */

const { stores, resetStores } = require('./setup.js');

// Now load the controller (mocking is handled by setup.js)
const userController = require('../controllers/userController.js');

// Helper to create mock req/res
function mockReq(body = {}, params = {}, query = {}, user = null) {
  return {
    body,
    params,
    query,
    user,
    files: null,
    header: () => null,
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

// ---- Tests ----

describe('User Controller \u2014 Registration', () => {
  beforeEach(() => resetStores());

  it('should register a new buyer successfully', async () => {
    const req = mockReq({
      full_name: 'John Buyer',
      email: 'john@test.com',
      password: 'password123',
      role: 'buyer',
    });
    const res = mockRes();

    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('john@test.com');
    expect(res.body.user.role).toBe('buyer');
    expect(res.body.user.referral_code).toBeTruthy();
    expect(res.body.user.referral_code).toContain('GN-');
    expect(res.body.token).toBeTruthy();
  });

  it('should register a seller with reseller level', async () => {
    const req = mockReq({
      full_name: 'Jane Seller',
      email: 'jane@test.com',
      password: 'password123',
      role: 'seller',
      seller_level: 'reseller',
    });
    const res = mockRes();

    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('seller');
    expect(res.body.user.seller_level).toBe('reseller');
    expect(res.body.user.status).toBe('pending'); // sellers start pending
  });

  it('should reject importer without license file', async () => {
    const req = mockReq({
      full_name: 'Importer No License',
      email: 'importer@test.com',
      password: 'password123',
      role: 'seller',
      seller_level: 'importer',
    });
    req.files = {};
    const res = mockRes();

    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('License file is required');
  });

  it('should register importer with license file', async () => {
    const req = mockReq({
      full_name: 'Importer With License',
      email: 'importer2@test.com',
      password: 'password123',
      role: 'seller',
      seller_level: 'importer',
    });
    req.files = { license_file: [{ filename: 'license.pdf' }] };
    const res = mockRes();

    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.seller_level).toBe('importer');
    expect(res.body.user.status).toBe('pending');
    expect(res.body.user.license_file).toBe('license.pdf');
  });

  it('should reject duplicate email', async () => {
    // First registration
    await userController.registerUser(
      mockReq({ full_name: 'A', email: 'dup@test.com', password: 'pass' }),
      mockRes()
    );
    // Second with same email
    const req = mockReq({ full_name: 'B', email: 'dup@test.com', password: 'pass' });
    const res = mockRes();
    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already in use');
  });

  it('should reject missing required fields', async () => {
    const req = mockReq({ email: 'noemail@test.com', password: 'pass' });
    const res = mockRes();
    await userController.registerUser(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('required');
  });

  it('should auto-generate referral code for all users', async () => {
    const req = mockReq({
      full_name: 'Ref Test',
      email: 'ref@test.com',
      password: 'pass',
      role: 'buyer',
    });
    const res = mockRes();
    await userController.registerUser(req, res);
    expect(res.body.user.referral_code).toMatch(/^GN-[A-Z0-9]{8}$/);
    expect(res.body.user.is_referrer).toBe(true);
  });

  it('should validate referred_by referral code', async () => {
    // Create referrer first
    const refReq = mockReq({ full_name: 'Referrer', email: 'ref1@test.com', password: 'pass' });
    const refRes = mockRes();
    await userController.registerUser(refReq, refRes);
    const referrerCode = refRes.body.user.referral_code;

    // New user with valid referral code
    const req = mockReq({
      full_name: 'Referred',
      email: 'referred@test.com',
      password: 'pass',
      referred_by: referrerCode,
    });
    const res = mockRes();
    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.user.referred_by).toBe(refRes.body.user.id);
  });

  it('should handle invalid referred_by gracefully', async () => {
    const req = mockReq({
      full_name: 'Bad Ref',
      email: 'badref@test.com',
      password: 'pass',
      referred_by: 'GN-INVALID1',
    });
    const res = mockRes();
    await userController.registerUser(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.user.referred_by).toBeNull();
  });
});

describe('User Controller \u2014 Login', () => {
  beforeEach(() => resetStores());

  it('should login with correct credentials', async () => {
    // Register first
    await userController.registerUser(
      mockReq({ full_name: 'Login Test', email: 'login@test.com', password: 'mypassword' }),
      mockRes()
    );

    const req = mockReq({ email: 'login@test.com', password: 'mypassword' });
    const res = mockRes();
    await userController.loginUser(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('login@test.com');
  });

  it('should reject wrong password', async () => {
    await userController.registerUser(
      mockReq({ full_name: 'Login Test', email: 'login2@test.com', password: 'correct' }),
      mockRes()
    );

    const req = mockReq({ email: 'login2@test.com', password: 'wrong' });
    const res = mockRes();
    await userController.loginUser(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('Invalid password');
  });

  it('should reject non-existent user', async () => {
    const req = mockReq({ email: 'nobody@test.com', password: 'pass' });
    const res = mockRes();
    await userController.loginUser(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('should reject suspended user', async () => {
    await userController.registerUser(
      mockReq({ full_name: 'Suspended', email: 'suspended@test.com', password: 'pass' }),
      mockRes()
    );
    // Manually suspend
    const user = stores.users.find((u) => u.email === 'suspended@test.com');
    user.status = 'suspended';

    const req = mockReq({ email: 'suspended@test.com', password: 'pass' });
    const res = mockRes();
    await userController.loginUser(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('suspended');
  });

  it('should update lastsignin on login', async () => {
    await userController.registerUser(
      mockReq({ full_name: 'LastSignin', email: 'last@test.com', password: 'pass' }),
      mockRes()
    );
    const user = stores.users.find((u) => u.email === 'last@test.com');
    expect(user.lastsignin).toBeUndefined();

    await userController.loginUser(
      mockReq({ email: 'last@test.com', password: 'pass' }),
      mockRes()
    );
    expect(user.lastsignin).toBeDefined();
  });
});

describe('User Controller \u2014 Upgrade to Seller', () => {
  beforeEach(() => resetStores());

  it('should upgrade buyer to reseller', async () => {
    // Create buyer
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'Upgrade Me', email: 'upgrade@test.com', password: 'pass' }),
      regRes
    );

    const req = mockReq({ seller_level: 'reseller' });
    req.user = stores.users.find((u) => u.email === 'upgrade@test.com');
    const res = mockRes();
    await userController.upgradeToSeller(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('seller');
    expect(res.body.user.seller_level).toBe('reseller');
    expect(res.body.user.status).toBe('active');
  });

  it('should upgrade buyer to importer with license', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'Upgrade Import', email: 'upgimp@test.com', password: 'pass' }),
      regRes
    );

    const req = mockReq({ seller_level: 'importer' });
    req.files = { license_file: [{ filename: 'biz_license.pdf' }] };
    req.user = stores.users.find((u) => u.email === 'upgimp@test.com');
    const res = mockRes();
    await userController.upgradeToSeller(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.seller_level).toBe('importer');
    expect(res.body.user.status).toBe('pending');
  });

  it('should reject importer upgrade without license', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'No License Upg', email: 'nolicense@test.com', password: 'pass' }),
      regRes
    );

    const req = mockReq({ seller_level: 'importer' });
    req.files = {};
    req.user = stores.users.find((u) => u.email === 'nolicense@test.com');
    const res = mockRes();
    await userController.upgradeToSeller(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('License file is required');
  });

  it('should reject invalid seller_level', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'Bad Level', email: 'badlevel@test.com', password: 'pass' }),
      regRes
    );

    const req = mockReq({ seller_level: 'wholesaler' });
    req.user = stores.users.find((u) => u.email === 'badlevel@test.com');
    const res = mockRes();
    await userController.upgradeToSeller(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('should reject if already a seller', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'Already Seller', email: 'already@test.com', password: 'pass', role: 'seller', seller_level: 'reseller' }),
      regRes
    );

    const req = mockReq({ seller_level: 'importer' });
    req.files = { license_file: [{ filename: 'lic.pdf' }] };
    req.user = stores.users.find((u) => u.email === 'already@test.com');
    const res = mockRes();
    await userController.upgradeToSeller(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already a seller');
  });
});

describe('User Controller \u2014 getAllUsers (Admin)', () => {
  beforeEach(async () => {
    resetStores();
    // Seed multiple users
    for (let i = 0; i < 25; i++) {
      await userController.registerUser(
        mockReq({
          full_name: `User ${i}`,
          email: `user${i}@test.com`,
          password: 'pass',
          role: i % 3 === 0 ? 'seller' : 'buyer',
          seller_level: i % 3 === 0 ? 'reseller' : undefined,
        }),
        mockRes()
      );
    }
  });

  it('should return users with pagination metadata', async () => {
    const req = mockReq({}, {}, { page: 1, limit: 10 });
    const res = mockRes();
    await userController.getAllUsers(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users).toHaveLength(10);
    expect(res.body.totalCount).toBe(26); // 25 + admin
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.nextPage).toBe(2);
  });

  it('should return last page with nextPage=null', async () => {
    const req = mockReq({}, {}, { page: 3, limit: 10 });
    const res = mockRes();
    await userController.getAllUsers(req, res);
    expect(res.body.nextPage).toBeNull();
  });

  it('should filter by role=seller', async () => {
    const req = mockReq({}, {}, { role: 'seller' });
    const res = mockRes();
    await userController.getAllUsers(req, res);
    const sellers = res.body.users;
    expect(sellers.length).toBeGreaterThan(0);
    sellers.forEach((u) => expect(u.role).toBe('seller'));
  });

  it('should filter by status', async () => {
    const req = mockReq({}, {}, { status: 'active' });
    const res = mockRes();
    await userController.getAllUsers(req, res);
    res.body.users.forEach((u) => expect(u.status).toBe('active'));
  });

  it('should support free-text search', async () => {
    const req = mockReq({}, {}, { search: 'User 5' });
    const res = mockRes();
    await userController.getAllUsers(req, res);
    expect(res.body.users.length).toBeGreaterThan(0);
    res.body.users.forEach((u) => {
      const matches = u.full_name.includes('User 5') || u.email.includes('user5');
      expect(matches).toBe(true);
    });
  });

  it('should treat "all" as no filter', async () => {
    const req = mockReq({}, {}, { role: 'all', status: 'all', limit: 10 });
    const res = mockRes();
    await userController.getAllUsers(req, res);
    expect(res.body.users.length).toBe(10); // first page of all
    expect(res.body.totalCount).toBe(26);
  });

  it('should exclude password from results', async () => {
    const req = mockReq({}, {}, { limit: 5 });
    const res = mockRes();
    await userController.getAllUsers(req, res);
    res.body.users.forEach((u) => expect(u.password).toBeUndefined());
  });
});

describe('User Controller \u2014 Update User Status (Admin)', () => {
  beforeEach(() => resetStores());

  it('should suspend a user', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'To Suspend', email: 'suspend@test.com', password: 'pass' }),
      regRes
    );
    const userId = regRes.body.user.id;

    const req = mockReq({ status: 'suspended' }, { id: userId });
    const res = mockRes();
    await userController.updateUserStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.status).toBe('suspended');
  });

  it('should reject invalid status', async () => {
    const req = mockReq({ status: 'banned' }, { id: 1 });
    const res = mockRes();
    await userController.updateUserStatus(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('should activate a pending seller', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'Pending Seller', email: 'pending@test.com', password: 'pass', role: 'seller', seller_level: 'reseller' }),
      regRes
    );
    // Manually set to pending
    stores.users.find((u) => u.email === 'pending@test.com').status = 'pending';

    const req = mockReq({ status: 'active' }, { id: regRes.body.user.id });
    const res = mockRes();
    await userController.updateUserStatus(req, res);
    expect(res.body.user.status).toBe('active');
  });
});

describe('User Controller \u2014 Referral Stats', () => {
  beforeEach(() => resetStores());

  it('should return referral stats for authenticated user', async () => {
    // Create referrer
    const refRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'Referrer', email: 'ref@test.com', password: 'pass' }),
      refRes
    );
    const referrer = stores.users.find((u) => u.email === 'ref@test.com');

    // Create referred user
    await userController.registerUser(
      mockReq({ full_name: 'Referred', email: 'referred@test.com', password: 'pass', referred_by: referrer.referral_code }),
      mockRes()
    );

    const req = mockReq({}, {}, {}, referrer);
    const res = mockRes();
    await userController.getReferralStats(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.referral_code).toBe(referrer.referral_code);
    expect(res.body.stats.total_referred).toBe(1);
    expect(res.body.stats.referred_users).toHaveLength(1);
  });

  it('should return zero stats for user with no referrals', async () => {
    const regRes = mockRes();
    await userController.registerUser(
      mockReq({ full_name: 'No Refs', email: 'norefs@test.com', password: 'pass' }),
      regRes
    );

    const req = mockReq({}, {}, {}, stores.users.find((u) => u.email === 'norefs@test.com'));
    const res = mockRes();
    await userController.getReferralStats(req, res);

    expect(res.body.stats.total_referred).toBe(0);
    expect(res.body.stats.referred_users).toHaveLength(0);
  });
});
