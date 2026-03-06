const https = require('https');
const fs = require('fs');
const compression = require('compression');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB } = require('./db/dbConnect.js');
const sequelize = require('./db/dbConnect.js');

// --- Route Imports ---
const adminRoutes = require('./routes/adminRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const addProductRoutes = require('./routes/addProductRoutes.js');
const catitemRoutes = require('./routes/catItemRoutes.js');
const subcatRoutes = require('./routes/subCatRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');
const telalakiRoutes = require('./routes/telalakiRoutes.js');
const assignOrderRoutes = require('./routes/assignOrderRoutes.js');
const vehicleFilesRoutes = require('./routes/vehicleFilesRoutes.js');
const uomRoutes = require('./routes/uomRoutes.js');
const shopRoutes = require('./routes/shopRoutes.js');
const deliveryBoyRoutes = require('./routes/deliveryBoyRoutes.js');
const deliveryRoutes = require('./routes/deliveryRoutes.js');
const withdrawRoutes = require('./routes/withdraw.js');
const cartRoutes = require('./routes/cartRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const ShopperPaymentRoutes = require('./routes/ShoperPaymentRoutes.js');
const checkoutRoutes = require('./routes/checkoutRoutes.js');
const receiptRoutes = require('./routes/receiptRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');
const deliveryFeeRoutes = require('./routes/deliveryFeeRoutes.js');
const { seedConfig } = require('./controllers/deliveryFeeModelAndController.js');
const paymentRoutes = require('./routes/paymentRoutes.js');

// --- Model Imports (for associations) ---
const User = require('./models/User.js');
const AddProduct = require('./models/AddProduct.js');
const UOM = require('./models/UOM.js');
const Category = require('./models/Category.js');
const Subcategory = require('./models/Subcategory.js');
const Shop = require('./models/Shop.js');
const ShopOwner = require('./models/ShopOwner.js');
const Payment = require('./models/Payment.js');
const DeliveryBoy = require('./models/DeliveryBoy.js');
const Shopper = require('./models/Shopper.js');
const AssignOrder = require('./models/AssignOrder.js');
const Notification = require('./models/Notification.js');

dotenv.config();

const app = express();

// ========================
//  MIDDLEWARE
// ========================
app.use(express.json());
app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mobapp.gebyanet.com',
    'https://test.piazdelivery.com',
    'https://shop.piazdelivery.com',
    'http://localhost:5173',
    'https://mobapp.piazdelivery.com',
    'https://piazdelivery.com',
    'https://mobadmin.piazdelivery.com',
    'https://deliveryapp.piazdelivery.com',
    'https://shopper.piazdelivery.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));
app.use(morgan('dev'));

// Disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving static files from:', path.join(__dirname, 'uploads'));

// ========================
//  ROUTES
// ========================

// --- Core ---
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);           // Unified: buyer, seller, agent
app.use('/api/prod', addProductRoutes);     // Primary product API

// --- Catalog ---
app.use('/api/category', categoryRoutes);
app.use('/api/subcat', subcatRoutes);
app.use('/api/catitem', catitemRoutes);
app.use('/api/uoms', uomRoutes);

// --- Commerce ---
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipt', receiptRoutes);
app.use('/api/shopper/payment-accounts', ShopperPaymentRoutes);

// --- Delivery ---
app.use('/api/delivery', deliveryRoutes);
app.use('/api/deliveryboy', deliveryBoyRoutes);
app.use('/api/deliveryFee', deliveryFeeRoutes);
app.use('/api/assign', assignOrderRoutes);
app.use('/api/telalaki', telalakiRoutes);
app.use('/api/vehicle-files', vehicleFilesRoutes);

// --- Other ---
app.use('/api/shop', shopRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/withdraw', withdrawRoutes);

// ========================
//  ERROR HANDLING
// ========================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});

// HTTPS redirect (production)
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// ========================
//  MODEL ASSOCIATIONS
// ========================

// Product ↔ UOM
AddProduct.hasMany(UOM, { foreignKey: 'product_id', as: 'uoms' });
UOM.belongsTo(AddProduct, { foreignKey: 'product_id', as: 'product' });

// Product ↔ User (seller)
User.hasMany(AddProduct, { foreignKey: 'seller_id', as: 'products' });
AddProduct.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });

// AssignOrder associations are defined in AssignOrder.associate() method

// Payment ↔ User
Payment.belongsTo(User, { foreignKey: 'shopper_id' });
User.hasMany(Payment, { foreignKey: 'shopper_id' });

// ========================
//  START SERVER
// ========================
const startServer = async () => {
  try {
    await connectDB();

    // Associate models
    const models = { Category, Subcategory, Payment, Shop, ShopOwner, Shopper, DeliveryBoy, AssignOrder, Notification };
    Object.keys(models).forEach((modelName) => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });

    // Sync database models
    await sequelize.sync({ alter: false });
    console.log('Database synchronized successfully.');

    // Seed delivery fee config after tables are created
    await seedConfig();

    // SSL configuration
    const privKeyPath = '/etc/letsencrypt/live/backend.gebyanet.com/privkey.pem';
    const fullChainPath = '/etc/letsencrypt/live/backend.gebyanet.com/fullchain.pem';

    if (fs.existsSync(privKeyPath) && fs.existsSync(fullChainPath)) {
      const sslOptions = {
        key: fs.readFileSync(privKeyPath),
        cert: fs.readFileSync(fullChainPath),
      };
      const PORT = process.env.PORT || 3443;
      https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT}`);
      });
    } else {
      console.warn('SSL certificates not found. Falling back to HTTP for local development.');
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`HTTP Server running on http://localhost:${PORT}`);
      });
    }

  } catch (error) {
    console.error('Error connecting to the database or starting the server:', error);
    process.exit(1);
  }
};

// Uncaught Exception and Rejection Handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
