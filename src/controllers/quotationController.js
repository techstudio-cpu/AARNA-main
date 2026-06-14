/**
 * Quotation Controller
 * Handles quotation operations (PostgreSQL-based)
 * Migrated from JSON file storage
 */

const db = require('../../config/database');
const { addAuditEntry } = require('../../config/audit-simple');
const { ApiError } = require('../middleware/errorHandler');

/**
 * List all quotations
 * GET /api/qb/quotations
 */
async function listQuotations(req, res, next) {
  try {
    const quotations = await db.getAllQuotations();
    res.json(quotations);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single quotation by ID
 * GET /api/qb/quotations/:id
 */
async function getQuotation(req, res, next) {
  try {
    const quotation = await db.getQuotationById(req.params.id);
    if (!quotation) {
      throw new ApiError('Quotation not found', 404);
    }
    res.json(quotation);
  } catch (error) {
    next(error);
  }
}

/**
 * Create new quotation
 * POST /api/qb/quotations
 */
async function createQuotation(req, res, next) {
  try {
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
      status,
      items
    } = req.body;

    if (!customerName || !customerPhone) {
      throw new ApiError('Customer name and phone are required', 400);
    }

    const quotation = await db.createQuotation({
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
      status: status || 'draft',
      items
    });

    addAuditEntry('QUOTATION_CREATED', req.currentUser.id, {
      quotationId: quotation.quotation_id,
      customerName: quotation.customer_name,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({ success: true, quotation });
  } catch (error) {
    next(error);
  }
}

/**
 * Update quotation
 * PUT /api/qb/quotations/:id
 */
async function updateQuotation(req, res, next) {
  try {
    const existing = await db.getQuotationById(req.params.id);
    if (!existing) {
      throw new ApiError('Quotation not found', 404);
    }

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
      items
    } = req.body;

    const quotation = await db.updateQuotation(req.params.id, {
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
      items
    });

    addAuditEntry('QUOTATION_UPDATED', req.currentUser.id, {
      quotationId: quotation.quotation_id,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true, quotation });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete quotation
 * DELETE /api/qb/quotations/:id
 */
async function deleteQuotation(req, res, next) {
  try {
    const deleted = await db.deleteQuotation(req.params.id);
    if (!deleted) {
      throw new ApiError('Quotation not found', 404);
    }

    addAuditEntry('QUOTATION_DELETED', req.currentUser.id, {
      quotationId: deleted.quotation_id,
      customerName: deleted.customer_name,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload PDF for quotation
 * POST /api/qb/quotations/:id/pdf
 * Note: PDFs are still stored on filesystem for now
 */
async function uploadQuotationPdf(req, res, next) {
  try {
    const quotation = await db.getQuotationById(req.params.id);
    if (!quotation) {
      throw new ApiError('Quotation not found', 404);
    }

    if (!req.file) {
      throw new ApiError('No PDF file uploaded', 400);
    }

    const path = require('path');
    const fs = require('fs');
    const DATA_DIR = path.join(__dirname, '..', '..', 'data');
    const QB_PDF_DIR = path.join(DATA_DIR, 'qb-pdfs');

    // Ensure directory exists
    if (!fs.existsSync(QB_PDF_DIR)) {
      fs.mkdirSync(QB_PDF_DIR, { recursive: true });
    }

    // Save PDF file
    const pdfPath = path.join(QB_PDF_DIR, `${quotation.id}.pdf`);
    fs.writeFileSync(pdfPath, req.file.buffer);

    // Update quotation with PDF URL
    await db.updateQuotation(req.params.id, {
      pdfUrl: `/api/qb/quotations/${quotation.id}/pdf`
    });

    res.json({
      success: true,
      path: `/api/qb/quotations/${quotation.id}/pdf`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Download quotation PDF
 * GET /api/qb/quotations/:id/pdf
 */
async function downloadQuotationPdf(req, res, next) {
  try {
    const path = require('path');
    const fs = require('fs');
    const DATA_DIR = path.join(__dirname, '..', '..', 'data');
    const QB_PDF_DIR = path.join(DATA_DIR, 'qb-pdfs');

    // First get quotation to find by id or quotation_id
    const quotation = await db.getQuotationById(req.params.id);
    if (!quotation) {
      throw new ApiError('Quotation not found', 404);
    }

    const pdfPath = path.join(QB_PDF_DIR, `${quotation.id}.pdf`);

    if (!fs.existsSync(pdfPath)) {
      throw new ApiError('PDF not found', 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotation_id || quotation.id}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  uploadQuotationPdf,
  downloadQuotationPdf
};
