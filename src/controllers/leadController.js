/**
 * Lead Controller
 * Handles all lead/CRM-related operations
 * Updated: Cache module removed
 */

const db = require('../../config/database');
const { addAuditEntry } = require('../../config/audit-simple');
const { STATUS_OPTIONS, PRIORITY_OPTIONS } = require('../constants');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Parse date string safely
 */
function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date) ? null : date;
}

/**
 * Create a new lead
 * POST /api/leads
 */
async function createLead(req, res, next) {
  try {
    const {
      name,
      phone,
      email,
      location,
      serviceType,
      message,
      priority,
      source,
      estimatedValue
    } = req.body;

    if (!name || !phone) {
      throw new ApiError('Name and phone are required', 400);
    }

    const lead = await db.createLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      location: location?.trim() || null,
      serviceType: serviceType?.trim() || null,
      message: message?.trim() || null,
      priority: PRIORITY_OPTIONS.includes(priority) ? priority : 'medium',
      source: source || 'website',
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null
    });


    addAuditEntry('LEAD_CREATED', req.currentUser.id, {
      leadId: lead.id,
      name: lead.name,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({ success: true, lead });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all leads with pagination and filtering
 * GET /api/leads
 * Query params:
 *   - limit: number (default 25, max 100)
 *   - offset: number (default 0)
 *   - status: filter by status
 *   - priority: filter by priority
 *   - source: filter by source
 *   - search: search in name/phone/email/location
 *   - sortBy: sort field (default: created_at)
 *   - sortOrder: asc or desc (default: desc)
 */
async function getLeads(req, res, next) {
  try {
    const {
      limit,
      offset,
      status,
      priority,
      source,
      assignedTo,
      search,
      sortBy,
      sortOrder
    } = req.query;

    // Build query options
    const options = {
      limit,
      offset,
      status,
      priority,
      source,
      assignedTo,
      search,
      sortBy,
      sortOrder
    };

    // Get paginated data and count in parallel
    const [leadsData, totalCount] = await Promise.all([
      db.getLeadsPaginated(options),
      db.getLeadsCount({ status, priority, source, assignedTo, search })
    ]);

    res.json({
      data: leadsData.data,
      pagination: {
        ...leadsData.pagination,
        total: totalCount
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single lead by ID
 * GET /api/leads/:id
 */
async function getLeadById(req, res, next) {
  try {
    const lead = await db.getLeadById(req.params.id);
    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }
    res.json(lead);
  } catch (error) {
    next(error);
  }
}

/**
 * Update lead status
 * PATCH /api/leads/:id/status
 */
async function updateLeadStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!STATUS_OPTIONS.includes(status)) {
      throw new ApiError('Invalid status', 400);
    }

    const lead = await db.getLeadById(req.params.id);
    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    const updates = { status };
    if (status === 'converted') {
      updates.convertedAt = new Date().toISOString();
    }

    const updated = await db.updateLead(req.params.id, updates);

    addAuditEntry('LEAD_STATUS_UPDATED', req.currentUser.id, {
      leadId: req.params.id,
      fromStatus: lead.status,
      toStatus: status,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, lead: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Update lead priority
 * PATCH /api/leads/:id/priority
 */
async function updateLeadPriority(req, res, next) {
  try {
    const { priority } = req.body;

    if (!PRIORITY_OPTIONS.includes(priority)) {
      throw new ApiError('Invalid priority', 400);
    }

    const lead = await db.getLeadById(req.params.id);
    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    const updated = await db.updateLead(req.params.id, { priority });

    res.json({ success: true, lead: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Add note to lead
 * POST /api/leads/:id/notes
 */
async function addLeadNote(req, res, next) {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      throw new ApiError('Note content required', 400);
    }

    const lead = await db.getLeadById(req.params.id);
    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    await db.addLeadNote(lead.id, content.trim(), req.currentUser.displayName);

    // Re-fetch lead with updated notes
    const updated = await db.getLeadById(req.params.id);

    addAuditEntry('LEAD_NOTE_ADDED', req.currentUser.id, {
      leadId: req.params.id,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, lead: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Update follow-up date
 * PATCH /api/leads/:id/followup
 */
async function updateFollowUp(req, res, next) {
  try {
    const { followUpDate, followUpNote } = req.body;

    const lead = await db.getLeadById(req.params.id);
    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    const updated = await db.updateLead(req.params.id, {
      followUpDate: followUpDate || null,
      followUpNote: followUpNote || ''
    });


    res.json({ success: true, lead: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Update lead details
 * PATCH /api/leads/:id
 */
async function updateLead(req, res, next) {
  try {
    const allowedFields = ['assignedTo', 'estimatedValue', 'tags', 'source', 'lostReason'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const lead = await db.getLeadById(req.params.id);
    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    const updated = await db.updateLead(req.params.id, updates);

    res.json({ success: true, lead: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete lead
 * DELETE /api/leads/:id
 */
async function deleteLead(req, res, next) {
  try {
    const removed = await db.deleteLead(req.params.id);
    if (!removed) {
      throw new ApiError('Lead not found', 404);
    }


    addAuditEntry('LEAD_DELETED', req.currentUser.id, {
      leadId: req.params.id,
      leadName: removed.name || 'Unknown',
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk update leads
 * POST /api/leads/bulk-update
 */
async function bulkUpdateLeads(req, res, next) {
  try {
    const { ids = [], updates = {} } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      throw new ApiError('No ids provided', 400);
    }

    let modified = 0;
    for (const id of ids) {
      const result = await db.updateLead(id, updates);
      if (result) modified++;
    }


    addAuditEntry('BULK_LEADS_UPDATED', req.currentUser.id, {
      count: modified,
      updates,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, modifiedCount: modified });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk delete leads
 * POST /api/leads/bulk-delete
 */
async function bulkDeleteLeads(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError('No lead IDs provided', 400);
    }

    let deleted = 0;
    const failed = [];

    for (const id of ids) {
      try {
        const removed = await db.deleteLead(id);
        if (removed) {
          deleted++;
        } else {
          failed.push({ id, reason: 'Not found' });
        }
      } catch (err) {
        failed.push({ id, reason: err.message });
      }
    }


    addAuditEntry('BULK_LEADS_DELETED', req.currentUser.id, {
      deleted,
      failed: failed.length,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, deleted, failed: failed.length > 0 ? failed : undefined });
  } catch (error) {
    next(error);
  }
}

/**
 * Export leads as CSV
 * GET /api/leads/export/csv
 */
async function exportLeadsCsv(req, res, next) {
  try {
    const leads = await db.getAllLeads();

    const headers = [
      'Name', 'Phone', 'Email', 'Location', 'Service Type', 'Status',
      'Priority', 'Source', 'Assigned To', 'Follow-up Date',
      'Estimated Value', 'Created At'
    ];

    const rows = leads.map(l => [
      l.name,
      l.phone,
      l.email || '',
      l.location || '',
      l.service_type || '',
      l.status || 'new',
      l.priority || 'medium',
      l.source || 'website',
      l.assigned_to || '',
      l.follow_up_date ? new Date(l.follow_up_date).toLocaleDateString('en-IN') : '',
      l.estimated_value || '',
      l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN') : ''
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    addAuditEntry('LEADS_EXPORTED', req.currentUser.id, {
      count: leads.length,
      format: 'csv',
      ip: req.ip || req.connection.remoteAddress
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=aarna-leads-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

/**
 * Get follow-ups due
 * GET /api/followups
 */
async function getFollowUps(req, res, next) {
  try {
    const now = new Date();
    const leads = await db.getAllLeads();

    const upcoming = leads
      .filter(lead => {
        const followUpDate = parseDate(lead.follow_up_date);
        return followUpDate && followUpDate <= now &&
               !['converted', 'lost'].includes(lead.status);
      })
      .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));

    res.json(upcoming);
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
