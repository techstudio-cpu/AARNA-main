const { query } = require('./postgres');

// Leads management
async function getAllLeads() {
  const result = await query(`
    SELECT * FROM leads
    ORDER BY created_at DESC
  `);
  return result.rows;
}

/**
 * Get leads with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Max results (default 25, max 100)
 * @param {number} options.offset - Number of results to skip
 * @param {string} options.status - Filter by status
 * @param {string} options.priority - Filter by priority
 * @param {string} options.source - Filter by source
 * @param {string} options.search - Search in name/phone/email/location
 * @param {string} options.sortBy - Sort field (default: created_at)
 * @param {string} options.sortOrder - asc or desc (default: desc)
 */
async function getLeadsPaginated(options = {}) {
  const {
    limit = 25,
    offset = 0,
    status,
    priority,
    source,
    assignedTo,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options;

  // Validate and sanitize limit/offset
  const validLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 100);
  const validOffset = Math.max(parseInt(offset) || 0, 0);

  // Whitelist allowed sort columns
  const allowedSortColumns = [
    'created_at', 'name', 'status', 'priority', 'assigned_to',
    'follow_up_date', 'estimated_value'
  ];
  const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Build WHERE conditions
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (priority && priority !== 'all') {
    conditions.push(`priority = $${paramIndex++}`);
    params.push(priority);
  }
  if (source && source !== 'all') {
    conditions.push(`source = $${paramIndex++}`);
    params.push(source);
  }
  if (assignedTo) {
    conditions.push(`assigned_to = $${paramIndex++}`);
    params.push(assignedTo);
  }
  if (search) {
    // Use full-text search for better performance with GIN index
    conditions.push(`(
      to_tsvector('english', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(location, ''))
      @@ plainto_tsquery('english', $${paramIndex})
      OR name ILIKE $${paramIndex}
      OR phone ILIKE $${paramIndex}
      OR email ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get paginated results
  const dataQuery = `
    SELECT * FROM leads
    ${whereClause}
    ORDER BY ${validSortBy} ${validSortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const dataResult = await query(dataQuery, [...params, validLimit, validOffset]);

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total FROM leads
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  return {
    data: dataResult.rows,
    total: total,
    pagination: {
      limit: validLimit,
      offset: validOffset,
      hasMore: dataResult.rows.length === validLimit,
      total: total
    }
  };
}

/**
 * Get total count of leads (optionally filtered)
 * @param {Object} filters - Same filters as getLeadsPaginated
 */
async function getLeadsCount(filters = {}) {
  const { status, priority, source, assignedTo, search } = filters;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (status && status !== 'all') {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (priority && priority !== 'all') {
    conditions.push(`priority = $${paramIndex++}`);
    params.push(priority);
  }
  if (source && source !== 'all') {
    conditions.push(`source = $${paramIndex++}`);
    params.push(source);
  }
  if (assignedTo) {
    conditions.push(`assigned_to = $${paramIndex++}`);
    params.push(assignedTo);
  }
  if (search) {
    // Use full-text search for better performance with GIN index
    conditions.push(`(
      to_tsvector('english', name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(location, ''))
      @@ plainto_tsquery('english', $${paramIndex})
      OR name ILIKE $${paramIndex}
      OR phone ILIKE $${paramIndex}
      OR email ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(`SELECT COUNT(*) as count FROM leads ${whereClause}`, params);
  return parseInt(result.rows[0].count);
}

async function getLeadById(id) {
  // Try UUID id first, then fall back to lead_id varchar
  let result = await query(`SELECT * FROM leads WHERE id::text = $1`, [id]);
  if (!result.rows[0]) {
    result = await query(`SELECT * FROM leads WHERE lead_id = $1`, [id]);
  }
  const lead = result.rows[0] || null;
  if (lead) {
    // Attach notes from lead_notes table
    const notesResult = await query(
      `SELECT note as content, created_by as "createdBy", created_at as "createdAt" FROM lead_notes WHERE lead_id = $1 ORDER BY created_at DESC`,
      [lead.id]
    );
    lead.notes = notesResult.rows;
  }
  return lead;
}

async function addLeadNote(leadUuid, content, createdBy) {
  const result = await query(
    `INSERT INTO lead_notes (lead_id, note, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [leadUuid, content, createdBy]
  );
  return result.rows[0];
}

async function createLead(leadData) {
  const result = await query(`
    INSERT INTO leads (
      lead_id, name, phone, email, location, service_type, message,
      status, priority, source, assigned_to, tags, follow_up_date,
      follow_up_note, estimated_value, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *
  `, [
    `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    leadData.name,
    leadData.phone,
    leadData.email,
    leadData.location,
    leadData.serviceType,
    leadData.message,
    leadData.status || 'new',
    leadData.priority || 'medium',
    leadData.source || 'website',
    leadData.assignedTo,
    leadData.tags || [],
    leadData.followUpDate ? new Date(leadData.followUpDate) : null,
    leadData.followUpNote,
    leadData.estimatedValue,
    new Date()
  ]);
  return result.rows[0];
}

async function updateLead(leadId, updateData) {
  // Whitelist allowed fields to prevent SQL injection
  const allowedFields = [
    'name', 'phone', 'email', 'location', 'service_type', 'message',
    'status', 'priority', 'source', 'assigned_to', 'tags',
    'follow_up_date', 'follow_up_note', 'estimated_value', 'actual_value',
    'lost_reason', 'last_contacted_at', 'converted_at'
  ];

  const setClause = [];
  const values = [];
  let paramIndex = 1;

  // Build dynamic update query with field whitelist
  for (const field of allowedFields) {
    const value = updateData[field];
    if (value !== undefined) {
      // Validate field name is alphanumeric with underscores only
      if (!/^[a-z_]+$/.test(field)) {
        throw new Error(`Invalid field name: ${field}`);
      }
      setClause.push(`${field} = $${paramIndex}`);
      // Handle date fields
      const isDateField = field.includes('_date') || field.includes('_at');
      values.push(isDateField ? (value ? new Date(value) : null) : value);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(leadId);

  // Try UUID id first, then fall back to lead_id varchar
  const updateQuery = `
    UPDATE leads 
    SET ${setClause.join(', ')}
    WHERE id::text = $${paramIndex}
    RETURNING *
  `;
  let result = await query(updateQuery, values);

  if (!result.rows[0]) {
    const fallbackQuery = `
      UPDATE leads 
      SET ${setClause.join(', ')}
      WHERE lead_id = $${paramIndex}
      RETURNING *
    `;
    result = await query(fallbackQuery, values);
  }

  return result.rows[0];
}

async function deleteLead(leadId) {
  // Try lead_id first, then fall back to UUID id
  let result = await query(`
    DELETE FROM leads WHERE lead_id = $1 RETURNING *
  `, [leadId]);
  if (!result.rows[0]) {
    result = await query(`
      DELETE FROM leads WHERE id::text = $1 RETURNING *
    `, [leadId]);
  }
  return result.rows[0];
}

// Ensure users table exists (safety net for deployments)
async function ensureUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(100) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255),
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'viewer',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Users management
async function getAllUsers() {
  await ensureUsersTable();
  const result = await query(`
    SELECT user_id, username, email, display_name, role, active, created_at
    FROM admin_users 
    ORDER BY created_at DESC
  `);
  return result.rows;
}

async function getUserById(userId) {
  await ensureUsersTable();
  const result = await query(`
    SELECT user_id, username, email, display_name, role, active, created_at
    FROM admin_users WHERE user_id = $1
  `, [userId]);
  return result.rows[0];
}

async function getUserByUsername(username) {
  await ensureUsersTable();
  const result = await query(`
    SELECT * FROM admin_users WHERE username = $1
  `, [username]);
  return result.rows[0];
}

async function createUser(userData) {
  const result = await query(`
    INSERT INTO admin_users (
      user_id, username, email, password, display_name, role, active, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    ) RETURNING user_id, username, email, display_name, role, active, created_at
  `, [
    `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userData.username,
    userData.email,
    userData.password,
    userData.displayName,
    userData.role || 'viewer',
    userData.active !== false,
    new Date()
  ]);
  return result.rows[0];
}

async function updateUser(userId, updateData) {
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  const updateFields = {
    username: updateData.username,
    email: updateData.email,
    password: updateData.password,
    display_name: updateData.displayName,
    role: updateData.role,
    active: updateData.active
  };

  for (const [field, value] of Object.entries(updateFields)) {
    if (value !== undefined) {
      setClause.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(userId);

  const result = await query(`
    UPDATE admin_users 
    SET ${setClause.join(', ')}
    WHERE user_id = $${paramIndex}
    RETURNING user_id, username, email, display_name, role, active, created_at
  `, values);

  return result.rows[0];
}

async function deleteUser(userId) {
  const result = await query(`
    DELETE FROM admin_users WHERE user_id = $1 RETURNING user_id, username
  `, [userId]);
  return result.rows[0];
}

// Ensure audit_logs table exists (safety net)
// Uses gen_random_uuid for UUID generation without requiring uuid-ossp extension
async function ensureAuditTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      audit_id VARCHAR(100) UNIQUE NOT NULL,
      action VARCHAR(100) NOT NULL,
      user_id VARCHAR(100),
      details JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Audit logs management
async function addAuditLog(action, userId, details = {}) {
  try {
    await ensureAuditTable();
    const safeDetails = { ...details };
    delete safeDetails.ip;
    delete safeDetails.userAgent;
    
    const result = await query(`
      INSERT INTO audit_logs (
        audit_id, action, user_id, details, ip_address, user_agent, created_at
      ) VALUES (
        $1, $2, $3, $4::jsonb, $5, $6, $7
      ) RETURNING *
    `, [
      `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      userId || null,
      JSON.stringify(safeDetails),
      details.ip || null,
      details.userAgent || null,
      new Date()
    ]);
    return result.rows[0];
  } catch (err) {
    console.error('addAuditLog error:', err.message);
    return null;
  }
}

async function getAuditLogs(filters = {}) {
  try {
    await ensureAuditTable();
    
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (filters.userId) {
      whereClause += ` AND user_id = $${paramIndex}`;
      values.push(filters.userId);
      paramIndex++;
    }

    if (filters.action) {
      whereClause += ` AND action = $${paramIndex}`;
      values.push(filters.action);
      paramIndex++;
    }

    if (filters.dateFrom) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      values.push(new Date(filters.dateFrom));
      paramIndex++;
    }

    if (filters.dateTo) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      values.push(new Date(filters.dateTo));
      paramIndex++;
    }

    const limit = parseInt(filters.limit) || 100;
    whereClause += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const result = await query(`
      SELECT * FROM audit_logs ${whereClause}
    `, values);

    // Map rows to frontend-friendly format
    return result.rows.map(row => ({
      id: row.audit_id || row.id,
      action: row.action,
      userId: row.user_id,
      details: row.details || {},
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error('getAuditLogs error:', err.message);
    return [];
  }
}

// Quotations management
async function getAllQuotations() {
  const result = await query(`
    SELECT q.*, qi.items as items
    FROM quotations q
    LEFT JOIN (
      SELECT quotation_id, json_agg(json_build_object(
        'id', id,
        'itemType', item_type,
        'description', description,
        'quantity', quantity,
        'unitPrice', unit_price,
        'totalPrice', total_price
      )) as items
      FROM quotation_items
      GROUP BY quotation_id
    ) qi ON qi.quotation_id = q.id
    ORDER BY q.created_at DESC
  `);
  return result.rows;
}

async function getQuotationById(id) {
  // Try UUID first, then quotation_id
  let result = await query(`
    SELECT q.*, qi.items as items
    FROM quotations q
    LEFT JOIN (
      SELECT quotation_id, json_agg(json_build_object(
        'id', id,
        'itemType', item_type,
        'description', description,
        'quantity', quantity,
        'unitPrice', unit_price,
        'totalPrice', total_price
      )) as items
      FROM quotation_items
      WHERE quotation_id = $1
      GROUP BY quotation_id
    ) qi ON qi.quotation_id = q.id
    WHERE q.id::text = $1 OR q.quotation_id = $1
  `, [id]);

  return result.rows[0] || null;
}

async function createQuotation(quotationData) {
  const {
    quotationId,
    leadId,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    systemCapacity,
    panelType,
    inverterType,
    batteryType,
    totalCost,
    subsidyAmount,
    customerCost,
    status = 'draft',
    items = []
  } = quotationData;

  // Insert quotation
  const quotationResult = await query(`
    INSERT INTO quotations (
      quotation_id, lead_id, customer_name, customer_phone, customer_email,
      customer_address, system_capacity, panel_type, inverter_type, battery_type,
      total_cost, subsidy_amount, customer_cost, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    quotationId || `QT_${Date.now()}`,
    leadId,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    systemCapacity,
    panelType,
    inverterType,
    batteryType,
    totalCost,
    subsidyAmount,
    customerCost,
    status
  ]);

  const quotation = quotationResult.rows[0];

  // Insert items if provided
  if (items && items.length > 0) {
    for (const item of items) {
      await query(`
        INSERT INTO quotation_items (quotation_id, item_type, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        quotation.id,
        item.itemType,
        item.description,
        item.quantity,
        item.unitPrice,
        item.totalPrice
      ]);
    }
  }

  return quotation;
}

async function updateQuotation(id, updateData) {
  const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    systemCapacity,
    panelType,
    inverterType,
    batteryType,
    totalCost,
    subsidyAmount,
    customerCost,
    status,
    pdfUrl,
    items
  } = updateData;

  // Build dynamic update
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (customerName !== undefined) { updates.push(`customer_name = $${paramIndex++}`); values.push(customerName); }
  if (customerPhone !== undefined) { updates.push(`customer_phone = $${paramIndex++}`); values.push(customerPhone); }
  if (customerEmail !== undefined) { updates.push(`customer_email = $${paramIndex++}`); values.push(customerEmail); }
  if (customerAddress !== undefined) { updates.push(`customer_address = $${paramIndex++}`); values.push(customerAddress); }
  if (systemCapacity !== undefined) { updates.push(`system_capacity = $${paramIndex++}`); values.push(systemCapacity); }
  if (panelType !== undefined) { updates.push(`panel_type = $${paramIndex++}`); values.push(panelType); }
  if (inverterType !== undefined) { updates.push(`inverter_type = $${paramIndex++}`); values.push(inverterType); }
  if (batteryType !== undefined) { updates.push(`battery_type = $${paramIndex++}`); values.push(batteryType); }
  if (totalCost !== undefined) { updates.push(`total_cost = $${paramIndex++}`); values.push(totalCost); }
  if (subsidyAmount !== undefined) { updates.push(`subsidy_amount = $${paramIndex++}`); values.push(subsidyAmount); }
  if (customerCost !== undefined) { updates.push(`customer_cost = $${paramIndex++}`); values.push(customerCost); }
  if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
  if (pdfUrl !== undefined) { updates.push(`pdf_url = $${paramIndex++}`); values.push(pdfUrl); }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  values.push(id);

  const result = await query(`
    UPDATE quotations
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id::text = $${paramIndex} OR quotation_id = $${paramIndex + 1}
    RETURNING *
  `, values);

  // Update items if provided
  if (items && items.length > 0) {
    // Delete existing items
    await query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [result.rows[0].id]);

    // Insert new items
    for (const item of items) {
      await query(`
        INSERT INTO quotation_items (quotation_id, item_type, description, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        result.rows[0].id,
        item.itemType,
        item.description,
        item.quantity,
        item.unitPrice,
        item.totalPrice
      ]);
    }
  }

  return result.rows[0];
}

async function deleteQuotation(id) {
  // Items will be deleted via CASCADE
  const result = await query(`
    DELETE FROM quotations WHERE id::text = $1 OR quotation_id = $1 RETURNING *
  `, [id]);
  return result.rows[0] || null;
}

// Statistics
async function getLeadsStats() {
  const result = await query(`
    SELECT 
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE status = 'new') as new_leads,
      COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
      COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
      COUNT(*) FILTER (WHERE status = 'proposal') as proposal,
      COUNT(*) FILTER (WHERE status = 'negotiation') as negotiation,
      COUNT(*) FILTER (WHERE status = 'converted') as converted,
      COUNT(*) FILTER (WHERE status = 'lost') as lost
    FROM leads
  `);
  return result.rows[0];
}

// ─── Safety-net table creation ───
async function ensureTemplatesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS quotation_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      is_preset BOOLEAN DEFAULT false,
      template_data JSONB NOT NULL DEFAULT '{}',
      default_components JSONB DEFAULT '[]',
      default_theme VARCHAR(50) DEFAULT 'default',
      default_cover_style VARCHAR(50) DEFAULT 'centered',
      default_service_layout VARCHAR(50) DEFAULT '2col',
      default_spacing VARCHAR(50) DEFAULT 'normal',
      default_header_style VARCHAR(50) DEFAULT 'wave',
      default_project_type VARCHAR(100),
      default_capacity DECIMAL(10, 2),
      default_payback_period DECIMAL(5, 2),
      created_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureClientsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(20),
      alternate_phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(10),
      company_name VARCHAR(255),
      gst_number VARCHAR(20),
      customer_type VARCHAR(20) DEFAULT 'residential',
      source VARCHAR(50),
      notes TEXT,
      tags TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by UUID,
      is_active BOOLEAN DEFAULT true
    )
  `);
}

async function ensureClientQuotationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS client_quotations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      relationship_type VARCHAR(20) DEFAULT 'primary',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, quotation_id)
    )
  `);
}

async function ensureQuotationVersionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS quotation_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      version_label VARCHAR(50),
      data JSONB NOT NULL,
      created_by UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      change_summary TEXT,
      is_major_revision BOOLEAN DEFAULT false,
      UNIQUE(quotation_id, version_number)
    )
  `);
}

async function ensureQuotationApprovalsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS quotation_approvals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      version_id UUID REFERENCES quotation_versions(id),
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      approved_by UUID,
      approved_at TIMESTAMP WITH TIME ZONE,
      rejection_reason TEXT,
      revision_notes TEXT,
      client_signature TEXT,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureClientActivitiesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS client_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      activity_type VARCHAR(50) NOT NULL,
      description TEXT,
      performed_by UUID,
      quotation_id UUID REFERENCES quotations(id),
      follow_up_date DATE,
      follow_up_completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ─── Template Functions ───
async function getAllTemplates() {
  await ensureTemplatesTable();

  const result = await query(
    'SELECT * FROM quotation_templates ORDER BY is_preset DESC, category, name',
    []
  );
  return result.rows;
}

async function getTemplatesByCategory(category) {
  await ensureTemplatesTable();
  const result = await query(
    'SELECT * FROM quotation_templates WHERE category = $1 OR is_preset = true ORDER BY is_preset DESC, name',
    [category]
  );
  return result.rows;
}

async function getTemplateById(templateId) {
  await ensureTemplatesTable();
  const result = await query(
    'SELECT * FROM quotation_templates WHERE template_id = $1',
    [templateId]
  );
  return result.rows[0];
}

async function createTemplate(templateData) {
  await ensureTemplatesTable();
  const { template_id, name, description, category, template_data, default_components, created_by, default_theme, default_cover_style, default_service_layout, default_spacing, default_header_style, default_project_type, default_capacity, default_payback_period } = templateData;
  const result = await query(
    `INSERT INTO quotation_templates 
     (template_id, name, description, category, template_data, default_components, created_by, 
      default_theme, default_cover_style, default_service_layout, default_spacing, default_header_style,
      default_project_type, default_capacity, default_payback_period)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [template_id, name, description, category, JSON.stringify(template_data), JSON.stringify(default_components), created_by, 
     default_theme, default_cover_style, default_service_layout, default_spacing, default_header_style,
     default_project_type, default_capacity, default_payback_period]
  );
  return result.rows[0];
}

async function updateTemplate(templateId, templateData) {
  await ensureTemplatesTable();
  const { name, description, template_data, default_components, default_theme, default_cover_style, default_service_layout, default_spacing, default_header_style, default_project_type, default_capacity, default_payback_period } = templateData;
  const result = await query(
    `UPDATE quotation_templates SET
     name = $1, description = $2, template_data = $3, default_components = $4,
     default_theme = $5, default_cover_style = $6, default_service_layout = $7,
     default_spacing = $8, default_header_style = $9, default_project_type = $10,
     default_capacity = $11, default_payback_period = $12, updated_at = CURRENT_TIMESTAMP
     WHERE template_id = $13 RETURNING *`,
    [name, description, JSON.stringify(template_data), JSON.stringify(default_components),
     default_theme, default_cover_style, default_service_layout, default_spacing, default_header_style,
     default_project_type, default_capacity, default_payback_period, templateId]
  );
  return result.rows[0];
}

async function deleteTemplate(templateId) {
  await ensureTemplatesTable();
  await query(
    'DELETE FROM quotation_templates WHERE template_id = $1 AND is_preset = false',
    [templateId]
  );
  return { success: true };
}

// ─── Client Management Functions ───

async function getAllClients(limit = 100, offset = 0) {
  await ensureClientsTable();
  await ensureClientQuotationsTable();
  await ensureClientActivitiesTable();
  const result = await query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM client_quotations cq WHERE cq.client_id = c.id) as quotation_count,
      (SELECT MAX(ca.created_at) FROM client_activities ca WHERE ca.client_id = c.id) as last_activity
     FROM clients c
     WHERE c.is_active = true
     ORDER BY c.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

async function getClientById(clientId) {
  await ensureClientsTable();
  await ensureClientQuotationsTable();
  await ensureClientActivitiesTable();
  const result = await query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM client_quotations cq WHERE cq.client_id = c.id) as quotation_count,
      (SELECT MAX(ca.created_at) FROM client_activities ca WHERE ca.client_id = c.id) as last_activity
     FROM clients c WHERE c.id = $1`,
    [clientId]
  );
  return result.rows[0];
}

async function getClientByCode(clientCode) {
  await ensureClientsTable();
  const result = await query(
    'SELECT * FROM clients WHERE client_code = $1',
    [clientCode]
  );
  return result.rows[0];
}

async function searchClients(searchTerm) {
  await ensureClientsTable();
  const result = await query(
    `SELECT * FROM clients
     WHERE is_active = true AND (
       name ILIKE $1 OR
       email ILIKE $1 OR
       phone ILIKE $1 OR
       client_code ILIKE $1 OR
       company_name ILIKE $1
     )
     ORDER BY name
     LIMIT 20`,
    [`%${searchTerm}%`]
  );
  return result.rows;
}

async function createClient(clientData) {
  await ensureClientsTable();
  const { client_code, name, email, phone, alternate_phone, address, city, state, pincode,
          company_name, gst_number, customer_type, source, notes, tags, created_by } = clientData;
  const result = await query(
    `INSERT INTO clients (client_code, name, email, phone, alternate_phone, address, city, state, pincode,
                        company_name, gst_number, customer_type, source, notes, tags, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [client_code, name, email, phone, alternate_phone, address, city, state, pincode,
     company_name, gst_number, customer_type, source, notes, tags || [], created_by]
  );
  return result.rows[0];
}

async function updateClient(clientId, clientData) {
  await ensureClientsTable();
  const { name, email, phone, alternate_phone, address, city, state, pincode,
          company_name, gst_number, customer_type, source, notes, tags, is_active } = clientData;
  const result = await query(
    `UPDATE clients SET
      name = $1, email = $2, phone = $3, alternate_phone = $4, address = $5, city = $6, state = $7, pincode = $8,
      company_name = $9, gst_number = $10, customer_type = $11, source = $12, notes = $13, tags = $14, is_active = $15,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $16
     RETURNING *`,
    [name, email, phone, alternate_phone, address, city, state, pincode,
     company_name, gst_number, customer_type, source, notes, tags, is_active, clientId]
  );
  return result.rows[0];
}

async function deleteClient(clientId) {
  await ensureClientsTable();
  // Soft delete
  await query(
    'UPDATE clients SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [clientId]
  );
  return { success: true };
}

// ─── Client Quotations Linking ───

async function linkClientToQuotation(clientId, quotationId, relationshipType = 'primary') {
  await ensureClientQuotationsTable();
  const result = await query(
    `INSERT INTO client_quotations (client_id, quotation_id, relationship_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_id, quotation_id) 
     DO UPDATE SET relationship_type = $3
     RETURNING *`,
    [clientId, quotationId, relationshipType]
  );
  return result.rows[0];
}

async function getQuotationsByClient(clientId) {
  await ensureClientQuotationsTable();
  const result = await query(
    `SELECT q.*, cq.relationship_type 
     FROM quotations q
     JOIN client_quotations cq ON q.id = cq.quotation_id
     WHERE cq.client_id = $1
     ORDER BY q.created_at DESC`,
    [clientId]
  );
  return result.rows;
}

async function getClientsByQuotation(quotationId) {
  await ensureClientQuotationsTable();
  const result = await query(
    `SELECT c.*, cq.relationship_type 
     FROM clients c
     JOIN client_quotations cq ON c.id = cq.client_id
     WHERE cq.quotation_id = $1 AND c.is_active = true`,
    [quotationId]
  );
  return result.rows;
}

// ─── Quotation Versioning Functions ───

async function createQuotationVersion(quotationId, versionData) {
  await ensureQuotationVersionsTable();
  const { version_number, version_label, data, created_by, change_summary, is_major_revision } = versionData;
  const result = await query(
    `INSERT INTO quotation_versions (quotation_id, version_number, version_label, data, created_by, change_summary, is_major_revision)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [quotationId, version_number, version_label, JSON.stringify(data), created_by, change_summary, is_major_revision]
  );
  return result.rows[0];
}

async function getQuotationVersions(quotationId) {
  await ensureQuotationVersionsTable();
  const result = await query(
    `SELECT v.*, u.username as created_by_name
     FROM quotation_versions v
     LEFT JOIN admin_users u ON v.created_by = u.id
     WHERE v.quotation_id = $1
     ORDER BY v.version_number DESC`,
    [quotationId]
  );
  return result.rows;
}

async function getQuotationVersionById(versionId) {
  await ensureQuotationVersionsTable();
  const result = await query(
    'SELECT * FROM quotation_versions WHERE id = $1',
    [versionId]
  );
  return result.rows[0];
}

async function getNextVersionNumber(quotationId) {
  await ensureQuotationVersionsTable();
  const result = await query(
    'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM quotation_versions WHERE quotation_id = $1',
    [quotationId]
  );
  return result.rows[0].next_version;
}

// ─── Approval Tracking Functions ───

async function createApprovalRecord(approvalData) {
  await ensureQuotationApprovalsTable();
  const { quotation_id, version_id, status, approved_by, rejection_reason, revision_notes, client_signature, ip_address, user_agent } = approvalData;
  const result = await query(
    `INSERT INTO quotation_approvals (quotation_id, version_id, status, approved_by, rejection_reason, revision_notes, client_signature, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [quotation_id, version_id, status, approved_by, rejection_reason, revision_notes, client_signature, ip_address, user_agent]
  );
  return result.rows[0];
}

async function updateApprovalStatus(approvalId, statusData) {
  await ensureQuotationApprovalsTable();
  const { status, approved_by, rejection_reason, revision_notes, client_signature } = statusData;
  const result = await query(
    `UPDATE quotation_approvals SET
      status = $1, approved_by = $2, approved_at = CASE WHEN $1 IN ('approved', 'rejected') THEN CURRENT_TIMESTAMP ELSE approved_at END,
      rejection_reason = $3, revision_notes = $4, client_signature = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [status, approved_by, rejection_reason, revision_notes, client_signature, approvalId]
  );
  return result.rows[0];
}

async function getApprovalByQuotation(quotationId) {
  await ensureQuotationApprovalsTable();
  const result = await query(
    `SELECT a.*, u.username as approved_by_name
     FROM quotation_approvals a
     LEFT JOIN admin_users u ON a.approved_by = u.id
     WHERE a.quotation_id = $1
     ORDER BY a.created_at DESC
     LIMIT 1`,
    [quotationId]
  );
  return result.rows[0];
}

// ─── Client Activity Functions ───

async function addClientActivity(activityData) {
  await ensureClientActivitiesTable();
  const { client_id, activity_type, description, performed_by, quotation_id, follow_up_date } = activityData;
  const result = await query(
    `INSERT INTO client_activities (client_id, activity_type, description, performed_by, quotation_id, follow_up_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [client_id, activity_type, description, performed_by, quotation_id, follow_up_date]
  );
  return result.rows[0];
}

async function getClientActivities(clientId, limit = 50) {
  await ensureClientActivitiesTable();
  const result = await query(
    `SELECT a.*, u.username as performed_by_name
     FROM client_activities a
     LEFT JOIN admin_users u ON a.performed_by = u.id
     WHERE a.client_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [clientId, limit]
  );
  return result.rows;
}

async function getPendingFollowUps() {
  await ensureClientsTable();
  await ensureClientActivitiesTable();
  const result = await query(
    `SELECT a.*, c.name as client_name, c.phone as client_phone, u.username as performed_by_name
     FROM client_activities a
     JOIN clients c ON a.client_id = c.id
     LEFT JOIN admin_users u ON a.performed_by = u.id
     WHERE a.follow_up_date <= CURRENT_DATE 
       AND a.follow_up_completed = false
       AND c.is_active = true
     ORDER BY a.follow_up_date ASC`,
    []
  );
  return result.rows;
}

module.exports = {
  // Leads
  getAllLeads,
  getLeadsPaginated,
  getLeadsCount,
  getLeadById,
  addLeadNote,
  createLead,
  updateLead,
  deleteLead,
  
  // Users
  getAllUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  
  // Audit logs
  addAuditLog,
  getAuditLogs,

  // Stats
  getLeadsStats,

  // Quotations
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,

  // Templates
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Client Management
  getAllClients,
  getClientById,
  getClientByCode,
  searchClients,
  createClient,
  updateClient,
  deleteClient,
  linkClientToQuotation,
  getQuotationsByClient,
  getClientsByQuotation,

  // Quotation Versioning
  createQuotationVersion,
  getQuotationVersions,
  getQuotationVersionById,
  getNextVersionNumber,

  // Approval Tracking
  createApprovalRecord,
  updateApprovalStatus,
  getApprovalByQuotation,

  // Client Activities
  addClientActivity,
  getClientActivities,
  getPendingFollowUps
};
