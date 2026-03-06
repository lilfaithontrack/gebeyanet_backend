/**
 * Seed Script: Creates sample products with purchase limits
 * Run: node seed_products.js
 */
const sequelize = require('./db/dbConnect.js');
const User = require('./models/User.js');
const Product = require('./models/AddProduct.js');
const bcrypt = require('bcrypt');

const sampleProducts = [
    {
        title: 'Organic Teff Flour',
        price: 120,
        description: 'Premium white teff flour from the highlands of Ethiopia. Perfect for injera.',
        brand: 'Gebya Net Organics',
        catItems: 'Groceries',
        subcat: 'Flour & Grains',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 5,
        sell_unit: 'kg',
        max_order_qty: 100,
        image: [],
        variations: [],
    },
    {
        title: 'Fresh Farm Eggs',
        price: 8,
        description: 'Free-range farm eggs, collected daily. Sold by the dozen.',
        brand: 'Addis Farm',
        catItems: 'Groceries',
        subcat: 'Dairy & Eggs',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 1,
        sell_unit: 'dozen',
        max_order_qty: 10,
        image: [],
        variations: [],
    },
    {
        title: 'Ethiopian Coffee Beans (Yirgacheffe)',
        price: 450,
        description: 'Single-origin Yirgacheffe coffee beans. Rich, fruity flavor with floral notes.',
        brand: 'Gebya Net Coffee',
        catItems: 'Beverages',
        subcat: 'Coffee',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 1,
        sell_unit: 'kg',
        max_order_qty: 50,
        image: [],
        variations: [],
    },
    {
        title: 'Wireless Bluetooth Earbuds',
        price: 1200,
        description: 'High-quality wireless earbuds with noise cancellation and 24-hour battery life.',
        brand: 'TechGN',
        catItems: 'Electronics',
        subcat: 'Audio',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 1,
        sell_unit: 'piece',
        max_order_qty: 5,
        image: [],
        variations: [],
    },
    {
        title: 'Construction Cement (Dangote)',
        price: 580,
        description: 'Premium grade Portland cement for construction. Sold per 50kg bag.',
        brand: 'Dangote',
        catItems: 'Building Materials',
        subcat: 'Cement',
        stock: 'in_stock',
        productfor: 'for_seller',
        min_order_qty: 10,
        sell_unit: 'quintal',
        max_order_qty: 500,
        image: [],
        variations: [],
    },
    {
        title: 'Bottled Water (Aquaddis)',
        price: 12,
        description: 'Purified natural spring water, 1L bottles. Sold in packs of 12.',
        brand: 'Aquaddis',
        catItems: 'Beverages',
        subcat: 'Water',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 1,
        sell_unit: 'pack',
        max_order_qty: 50,
        image: [],
        variations: [],
    },
    {
        title: 'Cotton Fabric (white)',
        price: 250,
        description: 'High-quality white cotton fabric for clothing and household use.',
        brand: 'Kombolcha Textile',
        catItems: 'Textiles',
        subcat: 'Fabric',
        stock: 'in_stock',
        productfor: 'for_seller',
        min_order_qty: 5,
        sell_unit: 'meter',
        max_order_qty: 200,
        image: [],
        variations: [],
    },
    {
        title: 'Men\'s Leather Shoes',
        price: 2800,
        description: 'Handcrafted genuine leather shoes. Classic Ethiopian craftsmanship.',
        brand: 'Anbessa Leather',
        catItems: 'Fashion',
        subcat: 'Shoes',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 1,
        sell_unit: 'pair',
        max_order_qty: 10,
        image: [],
        variations: [],
    },
    {
        title: 'Sunflower Oil (5L)',
        price: 380,
        description: 'Refined sunflower cooking oil. Bulk purchase available.',
        brand: 'Addis Modjo',
        catItems: 'Groceries',
        subcat: 'Cooking Oil',
        stock: 'in_stock',
        productfor: 'for_user',
        min_order_qty: 1,
        sell_unit: 'liter',
        max_order_qty: 100,
        image: [],
        variations: [],
    },
    {
        title: 'Cardboard Shipping Boxes (Medium)',
        price: 45,
        description: 'Sturdy medium-sized cardboard boxes for shipping and storage. Sold in bulk.',
        brand: 'PackET',
        catItems: 'Packaging',
        subcat: 'Boxes',
        stock: 'in_stock',
        productfor: 'for_seller',
        min_order_qty: 50,
        sell_unit: 'box',
        max_order_qty: 1000,
        image: [],
        variations: [],
    },
];

async function seed() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected!\n');

        // Sync the new columns
        await sequelize.sync({ alter: true });
        console.log('Database synced.\n');

        // 1. Create a demo seller user (or find existing)
        let seller = await User.findOne({ where: { email: 'seller@gebyanet.com' } });
        if (!seller) {
            seller = await User.create({
                full_name: 'Demo Seller',
                email: 'seller@gebyanet.com',
                phone: '+251911000001',
                password: await bcrypt.hash('seller123', 10),
                role: 'seller',
                status: 'active',
            });
            console.log(`✅ Created demo seller: ${seller.email} (id: ${seller.id})`);
        } else {
            console.log(`ℹ️  Demo seller already exists: ${seller.email} (id: ${seller.id})`);
        }

        // 2. Create sample products
        console.log('\nSeeding products with purchase limits...\n');

        for (const prod of sampleProducts) {
            const existing = await Product.findOne({ where: { title: prod.title } });
            if (existing) {
                console.log(`  ⏭️  Skipping "${prod.title}" (already exists)`);
                continue;
            }

            const created = await Product.create({
                ...prod,
                seller_id: seller.id,
            });

            console.log(`  ✅ ${created.title}`);
            console.log(`     Unit: ${created.sell_unit} | Min: ${created.min_order_qty} | Max: ${created.max_order_qty || 'unlimited'}`);
        }

        console.log('\n🎉 Seed complete!');
        console.log(`\nSummary: ${sampleProducts.length} products seeded for seller "${seller.full_name}" (id: ${seller.id})`);

    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

seed();
