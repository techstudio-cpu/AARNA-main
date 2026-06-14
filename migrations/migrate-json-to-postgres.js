const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/postgres');

async function migrateDataFromJSON() {
  console.log('🔄 Migrating data from JSON files to PostgreSQL...\n');
  
  try {
    // Check database connection
    await query('SELECT 1');
    console.log('✅ Database connected');
    
    // Clean up demo leads first
    await cleanupDemoLeads();
    
    // Migrate leads
    await migrateLeads();
    
    // Migrate users from JSON to PostgreSQL
    await migrateUsers();
    
    // Migrate audit logs
    await migrateAuditLogs();
    
    console.log('\n✅ Migration completed successfully');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

async function migrateLeads() {
  console.log('📋 Migrating leads...');
  
  const leadsFile = path.join(__dirname, '..', 'data', 'leads.json');
  if (!fs.existsSync(leadsFile)) {
    console.log('  ⏭️  No leads.json file found, skipping');
    return;
  }
  
  const leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  console.log(`  📊 Found ${leads.length} leads to migrate`);
  
  for (const lead of leads) {
    // Skip demo/sample leads (IDs starting with 'lead_demo_')
    if (lead.id && lead.id.startsWith('lead_demo_')) {
      console.log(`  ⏭️  Skipping demo lead: ${lead.name}`);
      continue;
    }
    
    try {
      await query(`
        INSERT INTO leads (
          lead_id, name, phone, email, location, service_type, message,
          status, priority, source, assigned_to, tags, follow_up_date,
          follow_up_note, last_contacted_at, converted_at,
          estimated_value, actual_value, lost_reason, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (lead_id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          location = EXCLUDED.location,
          service_type = EXCLUDED.service_type,
          message = EXCLUDED.message,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          source = EXCLUDED.source,
          assigned_to = EXCLUDED.assigned_to,
          tags = EXCLUDED.tags,
          follow_up_date = EXCLUDED.follow_up_date,
          follow_up_note = EXCLUDED.follow_up_note,
          last_contacted_at = EXCLUDED.last_contacted_at,
          converted_at = EXCLUDED.converted_at,
          estimated_value = EXCLUDED.estimated_value,
          actual_value = EXCLUDED.actual_value,
          lost_reason = EXCLUDED.lost_reason,
          updated_at = CURRENT_TIMESTAMP
      `, [
        lead.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lead.name,
        lead.phone,
        lead.email,
        lead.location,
        lead.serviceType,
        lead.message,
        lead.status,
        lead.priority,
        lead.source,
        lead.assignedTo,
        lead.tags || [],
        lead.followUpDate ? new Date(lead.followUpDate) : null,
        lead.followUpNote,
        lead.lastContactedAt ? new Date(lead.lastContactedAt) : null,
        lead.convertedAt ? new Date(lead.convertedAt) : null,
        lead.estimatedValue,
        lead.actualValue,
        lead.lostReason,
        lead.createdAt ? new Date(lead.createdAt) : new Date(),
        lead.updatedAt ? new Date(lead.updatedAt) : new Date()
      ]);
    } catch (error) {
      console.error(`    ❌ Failed to migrate lead ${lead.id}:`, error.message);
    }
  }
  
  console.log('  ✅ Leads migration completed');
}

async function migrateUsers() {
  console.log('👤 Migrating users...');
  
  const usersFile = path.join(__dirname, '..', 'data', 'users.json');
  if (!fs.existsSync(usersFile)) {
    console.log('  ⏭️  No users.json file found, skipping');
    return;
  }
  
  try {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    console.log(`  📊 Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        await query(`
          INSERT INTO admin_users (
            user_id, username, email, password, display_name, role, active, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          ) ON CONFLICT (user_id) DO UPDATE SET
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            display_name = EXCLUDED.display_name,
            role = EXCLUDED.role,
            active = EXCLUDED.active
        `, [
          user.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user.username,
          user.email || null,
          user.password,
          user.displayName || user.display_name || user.username,
          user.role || 'viewer',
          user.active !== false,
          user.createdAt ? new Date(user.createdAt) : new Date()
        ]);
      } catch (error) {
        if (error.message.includes('duplicate key') && error.message.includes('username')) {
          console.log(`    ⏭️  User ${user.username} already exists, skipping`);
        } else {
          console.error(`    ❌ Failed to migrate user ${user.username}:`, error.message);
        }
      }
    }
    
    console.log('  ✅ Users migration completed');
  } catch (error) {
    console.error('  ❌ Users migration failed:', error.message);
  }
}

async function migrateAuditLogs() {
  console.log('📋 Migrating audit logs...');
  
  const auditFile = path.join(__dirname, '..', 'data', 'audit.json');
  if (!fs.existsSync(auditFile)) {
    console.log('  ⏭️  No audit.json file found, skipping');
    return;
  }
  
  const auditLogs = JSON.parse(fs.readFileSync(auditFile, 'utf8'));
  console.log(`  📊 Found ${auditLogs.length} audit entries to migrate`);
  
  for (const entry of auditLogs) {
    try {
      await query(`
        INSERT INTO audit_logs (
          audit_id, action, user_id, details, ip_address, user_agent, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) ON CONFLICT (audit_id) DO NOTHING
      `, [
        entry.id,
        entry.action,
        entry.userId,
        JSON.stringify(entry.details || {}),
        entry.details?.ip || null,
        entry.details?.userAgent || null,
        new Date(entry.timestamp)
      ]);
    } catch (error) {
      console.error(`    ❌ Failed to migrate audit entry ${entry.id}:`, error.message);
    }
  }
  
  console.log('  ✅ Audit logs migration completed');
}

// Run migration if executed directly
if (require.main === module) {
  migrateDataFromJSON()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

// Clean up demo/sample leads from PostgreSQL (IDs starting with 'lead_demo_')
async function cleanupDemoLeads() {
  console.log('🧹 Cleaning up demo leads from database...');
  
  try {
    // Delete leads with IDs starting with 'lead_demo_'
    const result = await query(`
      DELETE FROM leads 
      WHERE lead_id LIKE 'lead_demo_%'
      RETURNING lead_id, name
    `);
    
    if (result.rows.length > 0) {
      console.log(`  ✅ Deleted ${result.rows.length} demo leads:`);
      result.rows.forEach(row => {
        console.log(`    - ${row.name} (${row.lead_id})`);
      });
    } else {
      console.log('  ℹ️  No demo leads found in database');
    }
  } catch (error) {
    console.error('  ⚠️  Failed to clean up demo leads:', error.message);
  }
}

module.exports = { migrateDataFromJSON };
