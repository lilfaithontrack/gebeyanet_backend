/**
 * Migration Script: User Roles & Referral System
 *
 * This script:
 * 1. Backfills referral codes for all existing users who don't have one
 * 2. Sets is_referrer = true for all users
 * 3. Migrates old 'agent' role users to 'buyer' with is_referrer = true
 *
 * Run with: node migrate_user_roles.js
 */

const crypto = require('crypto');
const sequelize = require('./db/dbConnect.js');
const User = require('./models/User.js');

const generateReferralCode = () => {
  return `GN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

const migrate = async () => {
  try {
    console.log('🔄 Starting user roles migration...\n');

    await sequelize.authenticate();
    console.log('✅ Database connected.\n');

    // Step 1: Ensure is_referrer column exists and set all to true
    console.log('📋 Step 1: Setting is_referrer = true for all users...');
    const [updatedReferrer] = await sequelize.query(
      "UPDATE users SET is_referrer = 1 WHERE is_referrer = 0 OR is_referrer IS NULL"
    );
    console.log(`   → Updated ${updatedReferrer} users.\n`);

    // Step 2: Migrate 'agent' role users to 'buyer'
    console.log('📋 Step 2: Migrating agent role users to buyer...');
    const [updatedAgents] = await sequelize.query(
      "UPDATE users SET role = 'buyer', is_referrer = 1 WHERE role = 'agent'"
    );
    console.log(`   → Migrated ${updatedAgents} agent users to buyer.\n`);

    // Step 3: Backfill referral codes for users who don't have one
    console.log('📋 Step 3: Backfilling referral codes...');
    const usersWithoutCode = await User.findAll({
      where: { referral_code: null },
      attributes: ['id', 'full_name', 'email'],
    });

    console.log(`   → Found ${usersWithoutCode.length} users without referral codes.`);

    for (const user of usersWithoutCode) {
      let code = generateReferralCode();
      let attempts = 0;

      // Ensure uniqueness
      while (attempts < 10) {
        const existing = await User.findOne({ where: { referral_code: code } });
        if (!existing) break;
        code = generateReferralCode();
        attempts++;
      }

      await user.update({ referral_code: code });
      console.log(`   → ${user.email}: ${code}`);
    }

    console.log(`\n   → Backfilled ${usersWithoutCode.length} referral codes.\n`);

    // Step 4: Summary
    console.log('📋 Step 4: Migration summary...');
    const totalUsers = await User.count();
    const usersWithCode = await User.count({ where: { referral_code: { [require('sequelize').Op.ne]: null } } });
    const buyers = await User.count({ where: { role: 'buyer' } });
    const sellers = await User.count({ where: { role: 'seller' } });
    const referrers = await User.count({ where: { is_referrer: true } });

    console.log(`   → Total users: ${totalUsers}`);
    console.log(`   → Buyers: ${buyers}`);
    console.log(`   → Sellers: ${sellers}`);
    console.log(`   → Users with referral code: ${usersWithCode}`);
    console.log(`   → Referrers: ${referrers}`);

    console.log('\n✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
