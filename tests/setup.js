/**
 * Test setup — mocks the Sequelize db connection AND common libraries
 * (bcrypt, jsonwebtoken, multer, nodemailer, sharp, qrcode) so tests can
 * run without external dependencies. All model queries are intercepted
 * via a simple in-memory store.
 */

const Module = require('module');
const path = require('path');
const crypto = require('crypto');

// ---- In-memory data stores ----
const stores = {
  users: [],
  products: [],
  payments: [],
  withdrawals: [],
  notifications: [],
  categories: [],
  subcategories: [],
  catItems: [],
  carts: [],
  checkouts: [],
  orders: [],
};

function resetStores() {
  // Clear arrays IN PLACE so mock model references stay valid
  Object.keys(stores).forEach((k) => stores[k].length = 0);
  stores.users.push({
    id: 1,
    full_name: 'Admin',
    email: 'admin@gebyanet.com',
    password: '$2b$10$hashedadmin',
    role: 'admin',
    status: 'active',
    referral_code: 'GN-ADMIN01',
    is_referrer: true,
    is_company: false,
    wallet_balance: 0,
    referral_earnings: 0,
    seller_level: null,
    referred_by: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    update(changes) { Object.assign(this, changes); this.updatedAt = new Date(); return this; },
    save() { return Promise.resolve(this); },
    destroy() { const i = stores.users.findIndex((r) => r.id === this.id); if (i > -1) stores.users.splice(i, 1); return Promise.resolve(); },
    toJSON() { const { password, ...rest } = this; return rest; },
  });
}

// ---- Mock model factory ----
function makeMockModel(storeName) {
  const store = stores[storeName];

  const model = {
    findAll: async (opts = {}) => {
      let results = [...store];
      if (opts.where) {
        const where = normalizeWhere(opts.where);
        results = results.filter((row) => {
          // Check each where entry
          for (const [k, v] of Object.entries(where)) {
            // Handle top-level Op.or (stored as symbol)
            if (k === 'or' && Array.isArray(v)) {
              const orMatch = v.some((cond) => {
                return Object.entries(cond).every(([kk, vv]) => matchValue(row[kk], vv));
              });
              if (!orMatch) return false;
              continue;
            }
            if (!matchValue(row[k], v)) return false;
          }
          // Check symbol-keyed where entries (Op.or at top level)
          for (const sym of Object.getOwnPropertySymbols(where)) {
            if (sym === Op.or) {
              const orMatch = where[sym].some((cond) => {
                return Object.entries(cond).every(([kk, vv]) => matchValue(row[kk], vv));
              });
              if (!orMatch) return false;
            }
            if (sym === Op.and) {
              const andMatch = where[sym].every((cond) => {
                return Object.entries(cond).every(([kk, vv]) => matchValue(row[kk], vv));
              });
              if (!andMatch) return false;
            }
          }
          return true;
        });
      }
      // Handle attributes.exclude
      if (opts.attributes && opts.attributes.exclude) {
        results = results.map((row) => {
          const filtered = {};
          for (const [k, v] of Object.entries(row)) {
            if (!opts.attributes.exclude.includes(k)) {
              filtered[k] = v;
            }
          }
          // Copy methods
          if (row.update) filtered.update = row.update.bind(row);
          if (row.save) filtered.save = row.save.bind(row);
          if (row.destroy) filtered.destroy = row.destroy.bind(row);
          if (row.toJSON) filtered.toJSON = row.toJSON.bind(row);
          return filtered;
        });
      }
      // Handle order (support both created_at and createdAt)
      if (opts.order && opts.order[0]) {
        const [field, dir] = Array.isArray(opts.order[0]) ? opts.order[0] : opts.order;
        results.sort((a, b) => {
          const av = a[field] || a[field === 'created_at' ? 'createdAt' : field];
          const bv = b[field] || b[field === 'created_at' ? 'createdAt' : field];
          if (av < bv) return dir === 'DESC' ? 1 : -1;
          if (av > bv) return dir === 'DESC' ? -1 : 1;
          return 0;
        });
      }
      if (opts.offset) results = results.slice(opts.offset);
      if (opts.limit) results = results.slice(0, opts.limit);
      return results;
    },

    findOne: async (opts = {}) => (await model.findAll(opts))[0] || null,
    findByPk: async (id) => store.find((r) => r.id === parseInt(id, 10)) || null,

    findAndCountAll: async (opts = {}) => {
      const all = await model.findAll({ ...opts, limit: undefined, offset: undefined });
      const rows = await model.findAll(opts);
      return { rows, count: all.length };
    },

    count: async (opts = {}) => (await model.findAll(opts)).length,
    sum: async (field, opts = {}) => (await model.findAll(opts)).reduce((s, r) => s + (parseFloat(r[field]) || 0), 0),

    create: async (data) => {
      const newId = store.length > 0 ? Math.max(...store.map((r) => r.id)) + 1 : 1;
      const row = {
        id: newId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        update(changes) { Object.assign(this, changes); this.updatedAt = new Date(); return this; },
        save() { return Promise.resolve(this); },
        destroy() { const i = store.findIndex((r) => r.id === this.id); if (i > -1) store.splice(i, 1); return Promise.resolve(); },
        toJSON() { const { password, ...rest } = this; return rest; },
      };
      store.push(row);
      return row;
    },

    update: async (changes, opts) => {
      const rows = await model.findAll(opts);
      rows.forEach((r) => Object.assign(r, changes, { updatedAt: new Date() }));
      return [rows.length];
    },

    destroy: async (opts) => {
      const rows = await model.findAll(opts);
      rows.forEach((r) => {
        const idx = store.findIndex((s) => s.id === r.id);
        if (idx > -1) store.splice(idx, 1);
      });
      return rows.length;
    },
  };

  return model;
}

// ---- Mock models ----
const mockModels = {
  User: makeMockModel('users'),
  Product: makeMockModel('products'),
  Payment: makeMockModel('payments'),
  WithdrawRequest: makeMockModel('withdrawals'),
  Notification: makeMockModel('notifications'),
  Category: makeMockModel('categories'),
  Subcategory: makeMockModel('subcategories'),
  CatItem: makeMockModel('catItems'),
  Cart: makeMockModel('carts'),
  Checkout: makeMockModel('checkouts'),
  Order: makeMockModel('orders'),
};

// ---- Mock Sequelize Op (used by controllers) ----
// Use symbols so they don't conflict with real field names
const Op = {
  ne: Symbol('ne'),
  like: Symbol('like'),
  or: Symbol('or'),
  and: Symbol('and'),
  gte: Symbol('gte'),
  lte: Symbol('lte'),
  gt: Symbol('gt'),
  lt: Symbol('lt'),
  in: Symbol('in'),
};

// Helper: check if a value is an Op symbol
function isOpKey(key) {
  return Object.values(Op).includes(key);
}

// Helper: normalize where clause from Sequelize Op format to our format
function normalizeWhere(where) {
  if (!where) return where;
  const result = {};
  for (const [k, v] of Object.entries(where)) {
    // Check if key is an Op symbol (stored as Symbol-valued property)
    result[k] = v;
  }
  // Also check for Symbol-keyed properties (Op.or, Op.and at top level)
  for (const sym of Object.getOwnPropertySymbols(where)) {
    result[sym] = where[sym];
  }
  return result;
}

// Helper: check if a row matches a where condition value
function matchValue(rowVal, cond) {
  if (cond === null || cond === undefined) return rowVal == null;
  if (typeof cond !== 'object' || cond instanceof Date) return rowVal === cond;
  // It's an Op condition object
  for (const [opKey, opVal] of Object.entries(cond)) {
    // Also check symbol keys
  }
  // Check symbol keys
  for (const sym of Object.getOwnPropertySymbols(cond)) {
    if (sym === Op.ne) return rowVal !== cond[sym];
    if (sym === Op.like) return String(rowVal || '').includes(String(cond[sym]).replace(/%/g, ''));
    if (sym === Op.gte) return parseFloat(rowVal) >= parseFloat(cond[sym]);
    if (sym === Op.lte) return parseFloat(rowVal) <= parseFloat(cond[sym]);
    if (sym === Op.gt) return parseFloat(rowVal) > parseFloat(cond[sym]);
    if (sym === Op.lt) return parseFloat(rowVal) < parseFloat(cond[sym]);
    if (sym === Op.in) return cond[sym].includes(rowVal);
  }
  // Check string keys (from normalized where)
  if (cond.ne !== undefined) return rowVal !== cond.ne;
  if (cond.like !== undefined) return String(rowVal || '').includes(String(cond.like).replace(/%/g, ''));
  if (cond.gte !== undefined) return parseFloat(rowVal) >= parseFloat(cond.gte);
  if (cond.lte !== undefined) return parseFloat(rowVal) <= parseFloat(cond.lte);
  if (cond.gt !== undefined) return parseFloat(rowVal) > parseFloat(cond.gt);
  if (cond.lt !== undefined) return parseFloat(rowVal) < parseFloat(cond.lt);
  if (cond.in) return cond.in.includes(rowVal);
  return rowVal === cond;
}

// ---- Mock Sequelize connection ----
const mockSequelize = {
  authenticate: async () => true,
  sync: async () => true,
  query: async () => [],
  define: (name) => mockModels[name] || makeMockModel(name.toLowerCase() + 's'),
  fn: () => ({}),
  col: () => ({}),
  QueryTypes: { SELECT: 'SELECT' },
  Op,
};

// ---- Mock Sequelize constructor ----
function MockSequelize() { return mockSequelize; }
MockSequelize.Op = Op;
MockSequelize.DataTypes = {
  STRING: 'STRING', INTEGER: 'INTEGER', FLOAT: 'FLOAT', DECIMAL: 'DECIMAL',
  TEXT: 'TEXT', BOOLEAN: 'BOOLEAN', DATE: 'DATE', ENUM: (...vals) => ({ type: 'ENUM', values: vals }),
  JSON: 'JSON', BIGINT: 'BIGINT',
};

// ---- Mock libraries ----
const mockBcrypt = {
  hash: async (pw) => `$2b$10$mocked_${pw}`,
  compare: async (pw, hash) => hash === `$2b$10$mocked_${pw}`,
};

const mockJwt = {
  sign: (payload) => `mock_token_${payload.id}_${payload.role}`,
  verify: (token) => {
    if (token && token.startsWith('mock_token_')) {
      const parts = token.split('_');
      return { id: parseInt(parts[2], 10), role: parts[3] };
    }
    throw new Error('Invalid token');
  },
};

function mockMulterMiddleware() {
  return (req, res, next) => { if (next) next(); };
}
function mockMulter() {
  const instance = (req, res, next) => { if (next) next(); };
  instance.single = () => mockMulterMiddleware;
  instance.array = () => mockMulterMiddleware;
  instance.fields = () => mockMulterMiddleware;
  return instance;
}
mockMulter.diskStorage = () => ({ destination: '', filename: '' });
mockMulter.memoryStorage = () => ({ destination: '', filename: '' });

const mockNodemailer = {
  createTransport: () => ({ sendMail: async () => ({ messageId: 'mock' }) }),
};

const mockSharp = () => ({
  resize: () => ({ webp: () => ({ toFile: async () => {} }) }),
  webp: () => ({ toFile: async () => {} }),
});

const mockQrcode = {
  toDataURL: async () => 'data:image/png;base64,mockqr',
};

const mockFsPromises = {
  unlink: async () => {},
  mkdir: async () => {},
  writeFile: async () => {},
  readFile: async () => '',
};

// ---- Intercept require ONCE ----
const originalRequire = Module.prototype.require;
const intercepted = new Set();

Module.prototype.require = function (id) {
  // Library mocks
  if (id === 'bcrypt' || id === 'bcryptjs') return mockBcrypt;
  if (id === 'jsonwebtoken') return mockJwt;
  if (id === 'multer') return mockMulter;
  if (id === 'nodemailer') return mockNodemailer;
  if (id === 'sharp') return mockSharp;
  if (id === 'qrcode') return mockQrcode;
  if (id === 'fs/promises') return mockFsPromises;

  // Sequelize constructor
  if (id === 'sequelize') return MockSequelize;

  // DB connection
  if (id === './db/dbConnect.js' || id === '../db/dbConnect.js' || id === '../config/db.js') {
    return mockSequelize;
  }

  // Model files
  const modelMap = {
    '/models/User.js': 'User',
    '/models/AddProduct.js': 'Product',
    '/models/Payment.js': 'Payment',
    '/models/WithdrawRequest.js': 'WithdrawRequest',
    '/models/Notification.js': 'Notification',
    '/models/Category.js': 'Category',
    '/models/Subcategory.js': 'Subcategory',
    '/models/CatItem.js': 'CatItem',
    '/models/Cart.js': 'Cart',
    '/models/Checkout.js': 'Checkout',
    '/models/Order.js': 'Order',
  };

  for (const [suffix, modelName] of Object.entries(modelMap)) {
    if (id.endsWith(suffix) || id === `.${suffix}` || id === `..${suffix}`) {
      return mockModels[modelName];
    }
  }

  return originalRequire.apply(this, arguments);
};

module.exports = {
  stores,
  resetStores,
  mockModels,
  mockSequelize,
  Op,
  mockBcrypt,
  mockJwt,
};
