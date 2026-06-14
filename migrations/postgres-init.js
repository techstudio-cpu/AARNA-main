const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/postgres');

async function runMigrations() {
  console.log('🔄 Running PostgreSQL migrations...\n');
  
  try {
    // Create migrations tracking table
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of executed migrations
    const executedResult = await query('SELECT filename FROM migrations ORDER BY id');
    const executedMigrations = executedResult.rows.map(row => row.filename);
    
    // Read migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const filename of migrationFiles) {
      if (executedMigrations.includes(filename)) {
        console.log(`  ⏭️  Skipping ${filename} (already executed)`);
        continue;
      }
      
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`  📝 Executing ${filename}...`);
      
      try {
        await query(sql);
        await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        console.log(`  ✅ ${filename} completed`);
      } catch (err) {
        console.error(`  ❌ ${filename} failed:`, err.message);
        throw err;
      }
    }
    
    console.log('\n✅ All migrations completed successfully');
    return true;
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    return false;
  }
}

module.exports = runMigrations;

// Run if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
