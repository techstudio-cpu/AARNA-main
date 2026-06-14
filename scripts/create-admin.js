/**
 * Manual Admin User Creation Script
 * Use this if auto-initialization fails or you need to create additional admin users
 * 
 * Usage: node scripts/create-admin.js
 * 
 * Environment Variables Required:
 * - DATABASE_URL (PostgreSQL connection string)
 * - ADMIN_USERNAME (for default admin)
 * - ADMIN_PASSWORD (for default admin)
 * - ADMIN_NAME (for default admin)
 */

require('dotenv').config();
const { initializeDefaultAdmin, createUser } = require('../config/auth-simple');

async function createAdminUser() {
  console.log('🔧 Manual Admin User Creation Tool\n');

  // Check environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('Set it in your Railway dashboard or .env file');
    process.exit(1);
  }

  // Try to initialize default admin from env vars
  console.log('1️⃣ Attempting to initialize default admin from environment variables...\n');
  try {
    const defaultAdmin = await initializeDefaultAdmin();
    if (defaultAdmin) {
      console.log('✅ Default admin user created/updated:');
      console.log(`   Username: ${defaultAdmin.username}`);
      console.log(`   Display Name: ${defaultAdmin.displayName}`);
      console.log(`   Role: ${defaultAdmin.role}\n`);
    } else {
      console.log('⚠️  Could not initialize default admin (missing env vars?)\n');
    }
  } catch (error) {
    console.error('❌ Error initializing default admin:', error.message);
  }

  // Option to create custom admin
  console.log('2️⃣ Create custom admin user (optional)\n');
  console.log('To create a custom admin, modify this script or call createUser() directly');
  console.log('Example:');
  console.log(`
  const customAdmin = await createUser({
    username: 'john_doe',
    password: 'secure_password_here',
    email: 'john@example.com',
    displayName: 'John Doe',
    role: 'manager',
    active: true
  });
  `);

  console.log('\n✅ Admin user creation process completed');
  console.log('\n📝 Next steps:');
  console.log('1. Update your Railway environment variables if needed');
  console.log('2. Restart your Railway deployment');
  console.log('3. Try logging in at /admin/login');

  process.exit(0);
}

createAdminUser().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
