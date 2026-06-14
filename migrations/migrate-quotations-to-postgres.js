/**
 * Migration: Move quotations from JSON file to PostgreSQL
 * Run once after deployment
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../config/postgres');

const DATA_DIR = path.join(__dirname, '..', 'data');
const QB_DATA_FILE = path.join(DATA_DIR, 'qb-quotations.json');

async function migrateQuotations() {
  console.log('📋 Starting quotations migration...');

  // Check if JSON file exists
  if (!fs.existsSync(QB_DATA_FILE)) {
    console.log('✅ No JSON quotations file found - nothing to migrate');
    return { migrated: 0, skipped: 0 };
  }

  // Load JSON data
  let jsonQuotations;
  try {
    const data = fs.readFileSync(QB_DATA_FILE, 'utf8');
    jsonQuotations = JSON.parse(data);
  } catch (err) {
    console.error('❌ Failed to read JSON file:', err.message);
    return { migrated: 0, skipped: 0, error: err.message };
  }

  if (!Array.isArray(jsonQuotations) || jsonQuotations.length === 0) {
    console.log('✅ No quotations to migrate');
    return { migrated: 0, skipped: 0 };
  }

  console.log(`📊 Found ${jsonQuotations.length} quotations in JSON file`);

  let migrated = 0;
  let skipped = 0;
  let errors = [];

  for (const q of jsonQuotations) {
    try {
      // Check if quotation already exists
      const existing = await query(
        'SELECT id FROM quotations WHERE quotation_id = $1 OR id::text = $2',
        [q.id, q.id]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping ${q.id} - already exists in database`);
        skipped++;
        continue;
      }

      // Extract customer data from old format
      const customer = q.customer || {};
      const payload = q.payload || {};

      // Insert quotation
      const quotationResult = await query(`
        INSERT INTO quotations (
          quotation_id, customer_name, customer_phone, customer_email,
          customer_address, system_capacity, panel_type, inverter_type,
          battery_type, total_cost, subsidy_amount, customer_cost, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        q.id || `QT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer.name || 'Unknown',
        customer.phone || '',
        customer.email || null,
        customer.address || null,
        payload.systemCapacity || null,
        payload.panelType || null,
        payload.inverterType || null,
        payload.batteryType || null,
        payload.totalCost || payload.total || null,
        payload.subsidy || payload.subsidyAmount || null,
        payload.customerCost || payload.netCost || null,
        q.status || 'draft'
      ]);

      const quotationId = quotationResult.rows[0].id;

      // Migrate items if present
      const items = payload.items || q.items || [];
      if (items.length > 0) {
        for (const item of items) {
          await query(`
            INSERT INTO quotation_items (
              quotation_id, item_type, description, quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            quotationId,
            item.type || item.itemType || 'Other',
            item.description || '',
            item.quantity || 1,
            item.unitPrice || item.price || 0,
            item.totalPrice || (item.price * item.quantity) || 0
          ]);
        }
      }

      migrated++;
      console.log(`✅ Migrated quotation ${q.id}`);

    } catch (err) {
      errors.push({ id: q.id, error: err.message });
      console.error(`❌ Failed to migrate ${q.id}:`, err.message);
    }
  }

  // Backup JSON file
  const backupFile = `${QB_DATA_FILE}.backup-${Date.now()}`;
  try {
    fs.renameSync(QB_DATA_FILE, backupFile);
    console.log(`📦 JSON file backed up to: ${backupFile}`);
  } catch (err) {
    console.warn('⚠️  Failed to backup JSON file:', err.message);
  }

  console.log(`\n📊 Migration complete:`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   - ${e.id}: ${e.error}`));
  }

  return { migrated, skipped, errors: errors.length };
}

// Run if called directly
if (require.main === module) {
  migrateQuotations()
    .then(result => {
      console.log('\n✅ Migration finished');
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateQuotations };
