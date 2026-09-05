/**
 * Product Controller Tests
 * Tests: createProduct, getAllProducts (with filters), getProductById,
 *        updateProductStatus, getMyProducts, deleteProduct
 */

const { stores, resetStores, mockModels } = require('./setup.js');

// Load the controller (mocking is handled by setup.js)
const productController = require('../controllers/addProductController.js');

function mockReq(body = {}, params = {}, query = {}, user = null, files = []) {
  return { body, params, query, user, files, header: () => null };
}

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

// Helper: create a seller user and return it
async function createSeller(level = 'reseller') {
  const user = await mockModels.User.create({
    full_name: `Seller ${level}`,
    email: `${level}@test.com`,
    password: 'hashed_pass',
    role: 'seller',
    seller_level: level,
    status: 'active',
    referral_code: `GN-${level.toUpperCase()}001`,
    is_referrer: true,
    wallet_balance: 0,
    referral_earnings: 0,
  });
  return user;
}

// ---- Tests ----

describe('Product Controller \u2014 Create Product', () => {
  beforeEach(() => resetStores());

  it('should create a retail product as reseller', async () => {
    const seller = await createSeller('reseller');
    const req = mockReq({
      title: 'Test Product',
      price: 100,
      description: 'A test product',
      brand: 'TestBrand',
      catItems: 'Electronics',
      subcat: 'Phones',
      product_type: 'retail',
      sell_unit: 'piece',
      min_order_qty: 1,
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Product');
    expect(res.body.product_type).toBe('retail');
    expect(res.body.seller_id).toBe(seller.id);
    expect(res.body.seller_level).toBe('reseller');
    expect(res.body.status).toBe('pending');
  });

  it('should create a wholesale product', async () => {
    const seller = await createSeller('reseller');
    const req = mockReq({
      title: 'Wholesale Item',
      price: 50,
      description: 'Bulk item',
      brand: 'BulkBrand',
      catItems: 'Food',
      subcat: 'Grains',
      product_type: 'wholesale',
      sell_unit: 'kg',
      min_order_qty: 100,
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.product_type).toBe('wholesale');
    expect(res.body.min_order_qty).toBe(100);
    expect(res.body.sell_unit).toBe('kg');
  });

  it('should create import product with origin_country', async () => {
    const seller = await createSeller('importer');
    const req = mockReq({
      title: 'Imported Phone',
      price: 500,
      description: 'Imported from China',
      brand: 'ImportBrand',
      catItems: 'Electronics',
      subcat: 'Phones',
      product_type: 'import',
      origin_country: 'China',
      sell_unit: 'piece',
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.product_type).toBe('import');
    expect(res.body.origin_country).toBe('China');
  });

  it('should reject import product without origin_country', async () => {
    const seller = await createSeller('importer');
    const req = mockReq({
      title: 'Bad Import',
      price: 100,
      description: 'No origin',
      brand: 'X',
      catItems: 'Electronics',
      subcat: 'Phones',
      product_type: 'import',
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('origin_country');
  });

  it('should reject import product by reseller', async () => {
    const seller = await createSeller('reseller');
    const req = mockReq({
      title: 'Reseller Import',
      price: 100,
      description: 'Reseller trying import',
      brand: 'X',
      catItems: 'Electronics',
      subcat: 'Phones',
      product_type: 'import',
      origin_country: 'China',
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('cannot create');
  });

  it('should create export product with destination_country', async () => {
    const seller = await createSeller('exporter');
    const req = mockReq({
      title: 'Export Coffee',
      price: 200,
      description: 'Export to Europe',
      brand: 'EthCoffee',
      catItems: 'Food',
      subcat: 'Coffee',
      product_type: 'export',
      destination_country: 'Germany',
      sell_unit: 'kg',
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.product_type).toBe('export');
    expect(res.body.destination_country).toBe('Germany');
  });

  it('should reject export by reseller', async () => {
    const seller = await createSeller('reseller');
    const req = mockReq({
      title: 'Bad Export',
      price: 100,
      description: 'Reseller export attempt',
      brand: 'X',
      catItems: 'Food',
      subcat: 'Coffee',
      product_type: 'export',
      destination_country: 'USA',
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('should default product_type to retail', async () => {
    const seller = await createSeller('reseller');
    const req = mockReq({
      title: 'Default Type',
      price: 50,
      description: 'No type specified',
      brand: 'X',
      catItems: 'Misc',
      subcat: 'Misc',
    }, {}, {}, seller, []);
    const res = mockRes();

    await productController.createProduct(req, res);
    expect(res.body.product_type).toBe('retail');
  });
});

describe('Product Controller \u2014 getAllProducts', () => {
  beforeEach(async () => {
    resetStores();
    const seller = await createSeller('reseller');
    // Create products with various statuses and types
    for (let i = 0; i < 10; i++) {
      await mockModels.Product.create({
        title: `Product ${i}`,
        price: 100 + i,
        description: `Desc ${i}`,
        brand: 'Brand',
        catItems: 'Electronics',
        subcat: i < 5 ? 'Phones' : 'Laptops',
        seller_id: seller.id,
        seller_email: seller.email,
        seller_level: 'reseller',
        product_type: i % 2 === 0 ? 'retail' : 'wholesale',
        status: i < 7 ? 'approved' : 'pending',
        sell_unit: 'piece',
        min_order_qty: 1,
      });
    }
  });

  it('should return only approved products by default', async () => {
    const req = mockReq({}, {}, {});
    const res = mockRes();
    await productController.getAllProducts(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(7);
    res.body.forEach((p) => expect(p.status).toBe('approved'));
  });

  it('should filter by status=pending', async () => {
    const req = mockReq({}, {}, { status: 'pending' });
    const res = mockRes();
    await productController.getAllProducts(req, res);
    expect(res.body.length).toBe(3);
    res.body.forEach((p) => expect(p.status).toBe('pending'));
  });

  it('should return all statuses with status=all', async () => {
    const req = mockReq({}, {}, { status: 'all' });
    const res = mockRes();
    await productController.getAllProducts(req, res);
    expect(res.body.length).toBe(10);
  });

  it('should filter by product_type', async () => {
    const req = mockReq({}, {}, { product_type: 'wholesale' });
    const res = mockRes();
    await productController.getAllProducts(req, res);
    res.body.forEach((p) => expect(p.product_type).toBe('wholesale'));
  });

  it('should filter by subcat', async () => {
    const req = mockReq({}, {}, { subcat: 'Phones' });
    const res = mockRes();
    await productController.getAllProducts(req, res);
    res.body.forEach((p) => expect(p.subcat).toBe('Phones'));
  });

  it('should filter seller_only=true (exclude admin products)', async () => {
    // Add an admin-level product
    await mockModels.Product.create({
      title: 'Admin Product',
      price: 999,
      description: 'Admin created',
      brand: 'Admin',
      catItems: 'Misc',
      subcat: 'Misc',
      seller_id: 1,
      seller_email: 'admin@gebyanet.com',
      seller_level: 'admin',
      product_type: 'retail',
      status: 'approved',
    });

    const req = mockReq({}, {}, { seller_only: 'true', status: 'all' });
    const res = mockRes();
    await productController.getAllProducts(req, res);

    res.body.forEach((p) => expect(p.seller_level).not.toBe('admin'));
  });
});

describe('Product Controller \u2014 getProductById', () => {
  beforeEach(() => resetStores());

  it('should return product by ID', async () => {
    const seller = await createSeller('reseller');
    const product = await mockModels.Product.create({
      title: 'Find Me',
      price: 50,
      description: 'Find by ID',
      brand: 'X',
      catItems: 'Misc',
      subcat: 'Misc',
      seller_id: seller.id,
      seller_email: seller.email,
      seller_level: 'reseller',
      product_type: 'retail',
      status: 'approved',
    });

    const req = mockReq({}, { id: product.id });
    const res = mockRes();
    await productController.getProductById(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Find Me');
  });

  it('should return 404 for non-existent product', async () => {
    const req = mockReq({}, { id: 99999 });
    const res = mockRes();
    await productController.getProductById(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('Product Controller \u2014 updateProductStatus (Admin)', () => {
  beforeEach(() => resetStores());

  it('should approve a pending product', async () => {
    const seller = await createSeller('reseller');
    const product = await mockModels.Product.create({
      title: 'To Approve',
      price: 100,
      description: 'Pending product',
      brand: 'X',
      catItems: 'Misc',
      subcat: 'Misc',
      seller_id: seller.id,
      seller_email: seller.email,
      seller_level: 'reseller',
      product_type: 'retail',
      status: 'pending',
    });

    const req = mockReq({ status: 'approved' }, { id: product.id });
    const res = mockRes();
    await productController.updateProductStatus(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.product.status).toBe('approved');
  });

  it('should reject a product', async () => {
    const seller = await createSeller('reseller');
    const product = await mockModels.Product.create({
      title: 'To Reject',
      price: 100,
      description: 'Will be rejected',
      brand: 'X',
      catItems: 'Misc',
      subcat: 'Misc',
      seller_id: seller.id,
      seller_email: seller.email,
      seller_level: 'reseller',
      product_type: 'retail',
      status: 'pending',
    });

    const req = mockReq({ status: 'rejected' }, { id: product.id });
    const res = mockRes();
    await productController.updateProductStatus(req, res);
    expect(res.body.product.status).toBe('rejected');
  });

  it('should reject invalid status value', async () => {
    const req = mockReq({ status: 'published' }, { id: 1 });
    const res = mockRes();
    await productController.updateProductStatus(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('should return 404 for non-existent product', async () => {
    const req = mockReq({ status: 'approved' }, { id: 99999 });
    const res = mockRes();
    await productController.updateProductStatus(req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe('Product Controller \u2014 getMyProducts (Seller)', () => {
  beforeEach(async () => {
    resetStores();
    const seller1 = await createSeller('reseller');
    const seller2 = await createSeller('importer');

    // Products for seller1
    for (let i = 0; i < 3; i++) {
      await mockModels.Product.create({
        title: `Seller1 Product ${i}`,
        price: 100,
        description: 'desc',
        brand: 'X',
        catItems: 'Misc',
        subcat: 'Misc',
        seller_id: seller1.id,
        seller_email: seller1.email,
        seller_level: 'reseller',
        product_type: 'retail',
        status: i === 0 ? 'approved' : 'pending',
      });
    }
    // Products for seller2
    await mockModels.Product.create({
      title: 'Seller2 Product',
      price: 200,
      description: 'desc',
      brand: 'Y',
      catItems: 'Misc',
      subcat: 'Misc',
      seller_id: seller2.id,
      seller_email: seller2.email,
      seller_level: 'importer',
      product_type: 'import',
      origin_country: 'China',
      status: 'approved',
    });
  });

  it('should return only the authenticated seller products', async () => {
    const seller = stores.users.find((u) => u.email === 'reseller@test.com');
    const req = mockReq({}, {}, {}, seller);
    const res = mockRes();
    await productController.getMyProducts(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(3);
    res.body.forEach((p) => expect(p.seller_id).toBe(seller.id));
  });

  it('should filter by status', async () => {
    const seller = stores.users.find((u) => u.email === 'reseller@test.com');
    const req = mockReq({}, {}, { status: 'approved' }, seller);
    const res = mockRes();
    await productController.getMyProducts(req, res);

    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe('approved');
  });
});

describe('Product Controller \u2014 Delete Product', () => {
  beforeEach(() => resetStores());

  it('should delete an existing product', async () => {
    const seller = await createSeller('reseller');
    const product = await mockModels.Product.create({
      title: 'To Delete',
      price: 50,
      description: 'Will be deleted',
      brand: 'X',
      catItems: 'Misc',
      subcat: 'Misc',
      seller_id: seller.id,
      seller_email: seller.email,
      seller_level: 'reseller',
      product_type: 'retail',
      status: 'approved',
      image: [],
      color_options: [],
    });

    const req = mockReq({}, { id: product.id });
    const res = mockRes();
    await productController.deleteProduct(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('deleted');
    // Verify it's gone
    const gone = await mockModels.Product.findByPk(product.id);
    expect(gone).toBeNull();
  });

  it('should return 404 when deleting non-existent product', async () => {
    const req = mockReq({}, { id: 99999 });
    const res = mockRes();
    await productController.deleteProduct(req, res);
    expect(res.statusCode).toBe(404);
  });
});
