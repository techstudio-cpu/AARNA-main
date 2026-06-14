/**
 * API Routes
 * All API endpoints under /api/
 */

const express = require('express');
const router = express.Router();

// Security imports
const { apiLimiter, publicLimiter } = require('../../config/security');
const { requireAuth, requireRole } = require('../middleware/auth');

// Controllers
const {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadPriority,
  addLeadNote,
  updateFollowUp,
  updateLead,
  deleteLead,
  bulkUpdateLeads,
  bulkDeleteLeads,
  exportLeadsCsv,
  getFollowUps
} = require('../controllers/leadController');

const {
  listUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const {
  submitCallback
} = require('../controllers/publicController');

const {
  recommendSystem,
  generateQuotationText,
  generateLeadInsights
} = require('../controllers/aiController');

const db = require('../../config/database');
const { loadUsers } = require('../../config/auth-simple');
const { getLeadsStats } = require('../../config/database');
const { getActiveSessions, invalidateUserSessions } = require('../../config/sessions');
const { getAuditLogs } = require('../../config/database');
const { addAuditEntry } = require('../../config/audit-simple');

// Lead routes (viewer+ access)
router.get('/contacts', apiLimiter, requireAuth, requireRole('viewer'), getLeads);
router.get('/leads', apiLimiter, requireAuth, requireRole('viewer'), getLeads);
router.get('/leads/:id', apiLimiter, requireAuth, requireRole('viewer'), getLeadById);
router.get('/followups', apiLimiter, requireAuth, requireRole('viewer'), getFollowUps);
router.get('/analytics', apiLimiter, requireAuth, requireRole('viewer'), async (req, res, next) => {
  try {
    const dbStats = await getLeadsStats();
    const leads = await db.getAllLeads();

    const { STATUS_OPTIONS, PRIORITY_OPTIONS, SOURCE_OPTIONS } = require('../constants');

    const byStatus = Object.fromEntries(STATUS_OPTIONS.map(s => [s, leads.filter(l => l.status === s).length]));
    const byPriority = Object.fromEntries(PRIORITY_OPTIONS.map(p => [p, leads.filter(l => l.priority === p).length]));
    const bySource = Object.fromEntries(SOURCE_OPTIONS.map(s => [s, leads.filter(l => l.source === s).length]));

    res.json({
      totalLeads: dbStats.total_leads,
      newLeads: dbStats.new_leads,
      contacted: dbStats.contacted,
      qualified: dbStats.qualified,
      proposal: dbStats.proposal,
      negotiation: dbStats.negotiation,
      converted: dbStats.converted,
      lost: dbStats.lost,
      byStatus,
      byPriority,
      bySource
    });
  } catch (error) {
    next(error);
  }
});

// Lead modification routes (manager+)
router.post('/leads', apiLimiter, requireAuth, requireRole('manager'), createLead);
router.patch('/leads/:id/status', apiLimiter, requireAuth, requireRole('manager'), updateLeadStatus);
router.patch('/leads/:id/priority', apiLimiter, requireAuth, requireRole('manager'), updateLeadPriority);
router.post('/leads/:id/notes', apiLimiter, requireAuth, requireRole('manager'), addLeadNote);
router.patch('/leads/:id/followup', apiLimiter, requireAuth, requireRole('manager'), updateFollowUp);
router.patch('/leads/:id', apiLimiter, requireAuth, requireRole('manager'), updateLead);
router.post('/leads/bulk-update', apiLimiter, requireAuth, requireRole('manager'), bulkUpdateLeads);
router.get('/leads/export/csv', apiLimiter, requireAuth, requireRole('manager'), exportLeadsCsv);

// Lead deletion (super_admin only)
router.delete('/leads/:id', apiLimiter, requireAuth, requireRole('super_admin'), deleteLead);
router.post('/leads/bulk-delete', apiLimiter, requireAuth, requireRole('super_admin'), bulkDeleteLeads);

// User management (super_admin only)
router.get('/users', apiLimiter, requireAuth, requireRole('super_admin'), listUsers);
router.post('/users', apiLimiter, requireAuth, requireRole('super_admin'), createUser);
router.patch('/users/:id', apiLimiter, requireAuth, requireRole('super_admin'), updateUser);
router.delete('/users/:id', apiLimiter, requireAuth, requireRole('super_admin'), deleteUser);

// System info (super_admin only)
router.get('/system-info', apiLimiter, requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const stats = await getLeadsStats();
    const users = await loadUsers();

    res.json({
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        platform: process.platform
      },
      database: {
        type: 'PostgreSQL',
        connected: true,
        totalLeads: parseInt(stats.total_leads) || 0,
        totalUsers: users.length
      },
      app: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000
      }
    });
  } catch (error) {
    next(error);
  }
});

// Audit logs (super_admin only)
router.get('/audit', apiLimiter, requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { userId, action, dateFrom, dateTo, limit = 100 } = req.query;
    const filters = { userId, action, dateFrom, dateTo, limit: parseInt(limit) };

    const auditLogs = await getAuditLogs(filters);

    res.json({
      total: auditLogs.length,
      entries: auditLogs
    });
  } catch (error) {
    next(error);
  }
});

// Session management (super_admin only)
router.get('/sessions', apiLimiter, requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { userId } = req.query;
    const sessions = getActiveSessions(userId);
    const users = await loadUsers();

    const enriched = sessions.map(session => {
      const user = users.find(u => u.id === session.userId);
      return {
        ...session,
        user: user ? {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role
        } : null
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

router.post('/sessions/invalidate/:userId', apiLimiter, requireAuth, requireRole('super_admin'), (req, res) => {
  const { userId } = req.params;

  if (userId === req.currentUser.id) {
    return res.status(400).json({ error: 'Cannot invalidate your own sessions' });
  }

  const count = invalidateUserSessions(userId);

  addAuditEntry('SESSIONS_INVALIDATED', req.currentUser.id, {
    targetUserId: userId,
    sessionsCount: count,
    ip: req.ip || req.connection.remoteAddress
  });

  res.json({ success: true, invalidatedSessions: count });
});

// Public callback API
router.post('/callback', submitCallback);

// Quotation Builder API (PostgreSQL-based)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  uploadQuotationPdf,
  downloadQuotationPdf
} = require('../controllers/quotationController');

router.get('/qb/quotations', apiLimiter, requireAuth, listQuotations);
router.get('/qb/quotations/:id', apiLimiter, requireAuth, getQuotation);
router.post('/qb/quotations', apiLimiter, requireAuth, createQuotation);
router.put('/qb/quotations/:id', apiLimiter, requireAuth, updateQuotation);
router.delete('/qb/quotations/:id', apiLimiter, requireAuth, deleteQuotation);
router.post('/qb/quotations/:id/pdf', apiLimiter, requireAuth, upload.single('file'), uploadQuotationPdf);
router.get('/qb/quotations/:id/pdf', apiLimiter, requireAuth, downloadQuotationPdf);

// Template API Routes
router.get('/qb/templates', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const templates = category 
      ? await db.getTemplatesByCategory(category)
      : await db.getAllTemplates();
    res.json({ success: true, templates });
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/qb/templates/:id', apiLimiter, requireAuth, async (req, res) => {
  try {
    const template = await db.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (err) {
    console.error('Error fetching template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/qb/templates', apiLimiter, requireAuth, async (req, res) => {
  try {
    const templateId = 'tmpl-' + Date.now();
    const templateData = {
      template_id: templateId,
      name: req.body.name,
      description: req.body.description,
      category: req.body.category || 'custom',
      template_data: req.body.template_data || {},
      default_components: req.body.default_components || [],
      created_by: req.currentUser.id,
      default_theme: req.body.default_theme || 'default',
      default_cover_style: req.body.default_cover_style || 'centered',
      default_service_layout: req.body.default_service_layout || '2col',
      default_spacing: req.body.default_spacing || 'normal',
      default_header_style: req.body.default_header_style || 'wave',
      default_project_type: req.body.default_project_type,
      default_capacity: req.body.default_capacity,
      default_payback_period: req.body.default_payback_period
    };
    const template = await db.createTemplate(templateData);
    res.json({ success: true, template });
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/qb/templates/:id', apiLimiter, requireAuth, async (req, res) => {
  try {
    const template = await db.updateTemplate(req.params.id, req.body);
    res.json({ success: true, template });
  } catch (err) {
    console.error('Error updating template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/qb/templates/:id', apiLimiter, requireAuth, async (req, res) => {
  try {
    await db.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting template:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Client Management API Routes ───

// Get all clients
router.get('/clients', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const clients = await db.getAllClients(parseInt(limit), parseInt(offset));
    res.json({ success: true, clients });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search clients
router.get('/clients/search', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, clients: [] });
    }
    const clients = await db.searchClients(q);
    res.json({ success: true, clients });
  } catch (err) {
    console.error('Error searching clients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID
router.get('/clients/:id', apiLimiter, requireAuth, async (req, res) => {
  try {
    const client = await db.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    res.json({ success: true, client });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client
router.post('/clients', apiLimiter, requireAuth, async (req, res) => {
  try {
    const clientCode = 'CLI-' + Date.now().toString().slice(-6);
    const clientData = {
      client_code: clientCode,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      alternate_phone: req.body.alternate_phone,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      company_name: req.body.company_name,
      gst_number: req.body.gst_number,
      customer_type: req.body.customer_type || 'residential',
      source: req.body.source,
      notes: req.body.notes,
      tags: req.body.tags || [],
      created_by: req.currentUser.id
    };
    const client = await db.createClient(clientData);
    res.json({ success: true, client });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update client
router.put('/clients/:id', apiLimiter, requireAuth, async (req, res) => {
  try {
    const client = await db.updateClient(req.params.id, req.body);
    res.json({ success: true, client });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete client (soft delete)
router.delete('/clients/:id', apiLimiter, requireAuth, async (req, res) => {
  try {
    await db.deleteClient(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get quotations for a client
router.get('/clients/:id/quotations', apiLimiter, requireAuth, async (req, res) => {
  try {
    const quotations = await db.getQuotationsByClient(req.params.id);
    res.json({ success: true, quotations });
  } catch (err) {
    console.error('Error fetching client quotations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Quotation Versioning API Routes ───

// Get all versions for a quotation
router.get('/qb/quotations/:id/versions', apiLimiter, requireAuth, async (req, res) => {
  try {
    const versions = await db.getQuotationVersions(req.params.id);
    res.json({ success: true, versions });
  } catch (err) {
    console.error('Error fetching quotation versions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new version
router.post('/qb/quotations/:id/versions', apiLimiter, requireAuth, async (req, res) => {
  try {
    const nextVersion = await db.getNextVersionNumber(req.params.id);
    const versionData = {
      version_number: nextVersion,
      version_label: req.body.version_label || `Version ${nextVersion}`,
      data: req.body.data,
      created_by: req.currentUser.id,
      change_summary: req.body.change_summary,
      is_major_revision: req.body.is_major_revision || false
    };
    const version = await db.createQuotationVersion(req.params.id, versionData);
    res.json({ success: true, version });
  } catch (err) {
    console.error('Error creating quotation version:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Approval Tracking API Routes ───

// Get approval status for a quotation
router.get('/qb/quotations/:id/approval', apiLimiter, requireAuth, async (req, res) => {
  try {
    const approval = await db.getApprovalByQuotation(req.params.id);
    res.json({ success: true, approval });
  } catch (err) {
    console.error('Error fetching approval:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create/update approval record
router.post('/qb/quotations/:id/approval', apiLimiter, requireAuth, async (req, res) => {
  try {
    const approvalData = {
      quotation_id: req.params.id,
      version_id: req.body.version_id,
      status: req.body.status,
      approved_by: req.body.status === 'approved' ? req.currentUser.id : null,
      rejection_reason: req.body.rejection_reason,
      revision_notes: req.body.revision_notes,
      client_signature: req.body.client_signature,
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    };
    const approval = await db.createApprovalRecord(approvalData);
    res.json({ success: true, approval });
  } catch (err) {
    console.error('Error creating approval:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update approval status
router.put('/qb/quotations/:id/approval', apiLimiter, requireAuth, async (req, res) => {
  try {
    const approval = await db.getApprovalByQuotation(req.params.id);
    if (!approval) {
      return res.status(404).json({ success: false, error: 'No approval record found' });
    }
    const statusData = {
      status: req.body.status,
      approved_by: req.body.status === 'approved' ? req.currentUser.id : approval.approved_by,
      rejection_reason: req.body.rejection_reason,
      revision_notes: req.body.revision_notes,
      client_signature: req.body.client_signature
    };
    const updated = await db.updateApprovalStatus(approval.id, statusData);
    res.json({ success: true, approval: updated });
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Client Activity API Routes ───

// Get client activities
router.get('/clients/:id/activities', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const activities = await db.getClientActivities(req.params.id, parseInt(limit));
    res.json({ success: true, activities });
  } catch (err) {
    console.error('Error fetching client activities:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add client activity
router.post('/clients/:id/activities', apiLimiter, requireAuth, async (req, res) => {
  try {
    const activityData = {
      client_id: req.params.id,
      activity_type: req.body.activity_type,
      description: req.body.description,
      performed_by: req.currentUser.id,
      quotation_id: req.body.quotation_id,
      follow_up_date: req.body.follow_up_date
    };
    const activity = await db.addClientActivity(activityData);
    res.json({ success: true, activity });
  } catch (err) {
    console.error('Error adding client activity:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get pending follow-ups
router.get('/follow-ups/pending', apiLimiter, requireAuth, async (req, res) => {
  try {
    const followUps = await db.getPendingFollowUps();
    res.json({ success: true, followUps });
  } catch (err) {
    console.error('Error fetching follow-ups:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Export & Sharing API Routes ───

// Email quotation
router.post('/qb/quotations/:id/email', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { to, subject, message, include_pdf } = req.body;
    
    // Get quotation data
    const quotation = await db.getQuotationById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    
    // Log email activity
    await db.addClientActivity({
      client_id: req.body.client_id,
      activity_type: 'email',
      description: `Quotation emailed to ${to}`,
      performed_by: req.currentUser.id,
      quotation_id: req.params.id
    });
    
    res.json({ 
      success: true, 
      message: 'Email queued for sending',
      details: { to, subject, include_pdf }
    });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate shareable link
router.post('/qb/quotations/:id/share', apiLimiter, requireAuth, async (req, res) => {
  try {
    const { expiry_days = 7 } = req.body;
    
    // Get quotation
    const quotation = await db.getQuotationById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    
    // Generate share token
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiry_days));
    
    // Store share token (in production, store in database)
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${shareToken}`;
    
    // Log share activity
    await db.addClientActivity({
      client_id: req.body.client_id,
      activity_type: 'share_link',
      description: `Shareable link generated (expires: ${expiresAt.toISOString().split('T')[0]})`,
      performed_by: req.currentUser.id,
      quotation_id: req.params.id
    });
    
    res.json({
      success: true,
      share_url: shareUrl,
      share_token: shareToken,
      expires_at: expiresAt
    });
  } catch (err) {
    console.error('Error generating share link:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export to Word (placeholder - returns HTML for now)
router.get('/qb/quotations/:id/export/word', apiLimiter, requireAuth, async (req, res) => {
  try {
    const quotation = await db.getQuotationById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Quotation not found' });
    }
    
    // For now, return HTML that can be opened as Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Quotation - ${quotation.customer_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #E87722; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #E87722; color: white; }
        </style>
      </head>
      <body>
        <h1>Solar Quotation</h1>
        <h2>${quotation.customer_name}</h2>
        <p><strong>Capacity:</strong> ${quotation.capacity_kwp} kWp</p>
        <p><strong>Total Cost:</strong> ₹${(quotation.total_cost || 0).toLocaleString()}</p>
        <p><strong>Date:</strong> ${new Date(quotation.created_at).toLocaleDateString()}</p>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${quotation.customer_name.replace(/\s+/g, '-')}.doc"`);
    res.send(htmlContent);
  } catch (err) {
    console.error('Error exporting Word:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AI Routes (Aarna AI) ───
router.post('/ai/recommend-system', apiLimiter, requireAuth, recommendSystem);
router.post('/ai/generate-quotation-text', apiLimiter, requireAuth, generateQuotationText);
router.post('/ai/lead-insights', apiLimiter, requireAuth, generateLeadInsights);

// ─── Bill Fetch Route (public — used by solar calculator) ───
const { fetchBill } = require('../services/billFetcher');
router.post('/bill/fetch', publicLimiter, async (req, res, next) => {
  try {
    const { provider, consumerNumber } = req.body;
    if (!provider || !consumerNumber) {
      return res.status(400).json({ success: false, error: 'Provider and consumer number are required' });
    }
    const result = await fetchBill(provider, consumerNumber.trim());
    res.json(result);
  } catch (error) {
    console.error('[BillFetch] Error:', error.message);
    next(error);
  }
});

module.exports = router;
