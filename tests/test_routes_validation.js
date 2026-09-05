/**
 * Routes & Server Configuration Tests
 * Verifies: all routes registered, legacy routes deprecated, middleware wired
 */

const fs = require('fs');
const path = require('path');

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

describe('Server Configuration \u2014 Route Registration', () => {
  it('server.js should exist', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'server.js'))).toBe(true);
  });

  it('should register all primary API routes', () => {
    const serverContent = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

    const expectedRoutes = [
      "app.use('/api/admin'",
      "app.use('/api/user'",
      "app.use('/api/prod'",
      "app.use('/api/category'",
      "app.use('/api/subcat'",
      "app.use('/api/catitem'",
      "app.use('/api/uoms'",
      "app.use('/api/cart'",
      "app.use('/api/checkout'",
      "app.use('/api/order'",
      "app.use('/api/payments'",
      "app.use('/api/receipt'",
      "app.use('/api/shopper'",
      "app.use('/api/delivery'",
      "app.use('/api/deliveryboy'",
      "app.use('/api/assign'",
      "app.use('/api/telalaki'",
      "app.use('/api/shop'",
      "app.use('/api/notifications'",
      "app.use('/api/chat'",
      "app.use('/api/withdraw'",
      "app.use('/api/payments'",
    ];

    expectedRoutes.forEach((route) => {
      expect(serverContent).toContain(route);
    });
  });

  it('should NOT register legacy seller/shopper-product routes', () => {
    const serverContent = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
    expect(serverContent).not.toContain("require('./routes/sellerRoutes.js')");
    expect(serverContent).not.toContain("require('./routes/sellerProductsRoutes.js')");
    expect(serverContent).not.toContain("require('./routes/shopperProductRoutes.js')");
    expect(serverContent).not.toContain("require('./routes/productRoutes.js')");
    expect(serverContent).not.toContain("require('./routes/CatRoutes.js')");
    expect(serverContent).not.toContain("require('./routes/ShopOwnerRoutes.js')");
  });
});

describe('Legacy Routes \u2014 Deprecation Headers', () => {
  const legacyFiles = [
    'sellerRoutes.js',
    'sellerProductsRoutes.js',
    'shopperProductRoutes.js',
    'productRoutes.js',
    'CatRoutes.js',
    'ShopOwnerRoutes.js',
  ];

  legacyFiles.forEach((file) => {
    it(`${file} should have @deprecated header`, () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'routes', file), 'utf8');
      expect(content).toContain('@deprecated');
    });
  });
});

describe('User Routes \u2014 Endpoint Mapping', () => {
  it('should define all required user endpoints', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'userRoutes.js'), 'utf8');

    const expectedEndpoints = [
      "router.post('/register'",
      "router.post('/login'",
      "router.post('/send-otp'",
      "router.post('/verify-otp'",
      "router.post('/forgot-password'",
      "router.post('/reset-password'",
      "router.get('/profile'",
      "router.put('/profile'",
      "router.post('/upgrade-to-seller'",
      "router.get('/referral/stats'",
      "router.get('/referral/admin-stats'",
      "router.get('/',",  // getAllUsers
      "router.get('/:id'",
      "router.put('/:id',",  // updateUser
      "router.put('/:id/status'",
      "router.delete('/:id'",
    ];

    expectedEndpoints.forEach((ep) => {
      expect(content).toContain(ep);
    });
  });

  it('should protect admin routes with adminAuth middleware', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'userRoutes.js'), 'utf8');
    // Admin routes should have adminAuth
    expect(content).toContain('adminAuth, getAdminReferralStats');
    expect(content).toContain('adminAuth, getAllUsers');
    expect(content).toContain('adminAuth, updateUserStatus');
    expect(content).toContain('adminAuth, deleteUser');
  });

  it('should protect user routes with verifyUser middleware', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'userRoutes.js'), 'utf8');
    expect(content).toContain('verifyUser, getProfile');
    expect(content).toContain('verifyUser, upload');
    expect(content).toContain('verifyUser, getReferralStats');
  });
});

describe('Product Routes \u2014 Endpoint Mapping', () => {
  it('should define all required product endpoints', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'addProductRoutes.js'), 'utf8');

    const expectedEndpoints = [
      "router.get('/',",
      "router.get('/location'",
      "router.get('/my-products'",
      "router.get('/:id'",
      "router.post('/',",
      "router.put('/:id',",
      "router.delete('/:id',",
      "router.put('/:id/status'",
    ];

    expectedEndpoints.forEach((ep) => {
      expect(content).toContain(ep);
    });
  });

  it('should protect seller routes with verifyUser', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'addProductRoutes.js'), 'utf8');
    expect(content).toContain('verifyUser, getMyProducts');
    expect(content).toContain('verifyUser, upload, createProduct');
    expect(content).toContain('verifyUser, upload, updateProduct');
    expect(content).toContain('verifyUser, deleteProduct');
  });

  it('should protect admin status route with adminAuth', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'addProductRoutes.js'), 'utf8');
    expect(content).toContain('adminAuth, updateProductStatus');
  });
});

describe('Withdraw Routes \u2014 Endpoint Mapping', () => {
  it('should define all required withdraw endpoints', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'withdraw.js'), 'utf8');

    expect(content).toContain("router.post('/request'");
    expect(content).toContain("router.get('/my'");
    expect(content).toContain("router.get('/',");
    expect(content).toContain("router.put('/:id/status'");
  });

  it('should protect user withdraw routes with verifyUser', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'withdraw.js'), 'utf8');
    expect(content).toContain('verifyUser, requestWithdraw');
    expect(content).toContain('verifyUser, getMyWithdrawals');
  });

  it('should protect admin withdraw routes with adminAuth', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'withdraw.js'), 'utf8');
    expect(content).toContain('adminAuth, getAllWithdrawals');
    expect(content).toContain('adminAuth, updateWithdrawalStatus');
  });
});

describe('Notification Routes \u2014 Endpoint Mapping', () => {
  it('should define authenticated notification endpoints', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'routes', 'notificationRoutes.js'), 'utf8');
    expect(content).toContain("router.get('/my'");
    expect(content).toContain("router.put('/my/:id/read'");
    expect(content).toContain("router.put('/my/read-all'");
  });
});

describe('Models \u2014 Schema Validation', () => {
  it('User model should define all required fields', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'User.js'), 'utf8');
    const requiredFields = [
      'role', 'seller_level', 'full_name', 'email', 'password',
      'wallet_balance', 'referral_earnings', 'is_referrer',
      'referral_code', 'referred_by', 'license_file', 'status',
    ];
    requiredFields.forEach((f) => expect(content).toContain(f));
  });

  it('User model should have correct role enum', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'User.js'), 'utf8');
    expect(content).toContain("ENUM('buyer', 'seller')");
  });

  it('User model should have correct seller_level enum', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'User.js'), 'utf8');
    expect(content).toContain("ENUM('importer', 'exporter', 'reseller')");
  });

  it('AddProduct model should define unified product fields', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'AddProduct.js'), 'utf8');
    const fields = [
      'seller_id', 'seller_email', 'seller_level',
      'product_type', 'origin_country', 'destination_country',
      'min_order_qty', 'max_order_qty', 'sell_unit',
    ];
    fields.forEach((f) => expect(content).toContain(f));
  });

  it('AddProduct model should have correct product_type enum', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'AddProduct.js'), 'utf8');
    expect(content).toContain("ENUM('retail', 'wholesale', 'import', 'export')");
  });

  it('Notification model should use user_notifications table', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'Notification.js'), 'utf8');
    expect(content).toContain("tableName: 'user_notifications'");
  });

  it('WithdrawRequest model should have correct status enum', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'models', 'WithdrawRequest.js'), 'utf8');
    expect(content).toContain("ENUM('Pending', 'Approved', 'Declined')");
  });
});

describe('Migration \u2014 Schema Sync', () => {
  it('migration file should exist', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'))).toBe(true);
  });

  it('migration should add user columns', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'), 'utf8');
    expect(content).toContain("addColumnIfMissing(queryInterface, 'users', 'seller_level'");
    expect(content).toContain("addColumnIfMissing(queryInterface, 'users', 'referral_earnings'");
    expect(content).toContain("addColumnIfMissing(queryInterface, 'users', 'is_referrer'");
  });

  it('migration should add product columns', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'), 'utf8');
    expect(content).toContain("addColumnIfMissing(queryInterface, 'products', 'seller_level'");
    expect(content).toContain("addColumnIfMissing(queryInterface, 'products', 'product_type'");
    expect(content).toContain("addColumnIfMissing(queryInterface, 'products', 'origin_country'");
  });

  it('migration should create user_notifications table', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'), 'utf8');
    expect(content).toContain("createTable('user_notifications'");
  });

  it('migration should create withdraw_requests table', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'), 'utf8');
    expect(content).toContain("createTableIfMissing(queryInterface, 'withdraw_requests'");
  });

  it('migration should drop legacy is_agent column', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'), 'utf8');
    expect(content).toContain("dropColumnIfPresent(queryInterface, 'users', 'is_agent')");
  });

  it('migration should be idempotent (guard helpers)', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'migrations', '20260801000000-sync-models-with-db.js'), 'utf8');
    expect(content).toContain('addColumnIfMissing');
    expect(content).toContain('dropColumnIfPresent');
    expect(content).toContain('createTableIfMissing');
  });
});
