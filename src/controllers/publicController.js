/**
 * Public Controller
 * Handles public website routes
 */

const { getAllLeads } = require('../../config/database');
const mailer = require('../../config/mailer');

// Portfolio data (could be moved to database in future)
const portfolioData = {
  industrial: [
    { name: 'Mahakoshi Refractories Pvt. Ltd.', capacity: '1523 Kwp', location: 'Katni' },
    { name: 'Khanna Polyweave Pvt. Ltd.', capacity: '880 Kwp', location: 'Katni' },
    { name: 'Union Flour Mill', capacity: '660 Kwp', location: 'Rewa' },
    { name: 'Shukla Agritech Pvt. Ltd.', capacity: '361 Kwp', location: 'Rewa' },
    { name: 'Shukla Agritech Pvt. Ltd.', capacity: '261 Kwp', location: 'Rewa' },
    { name: 'Sukh Sugar Ltd.', capacity: '250 Kwp', location: 'Rewa' },
    { name: 'Union Agrotech Pvt. Ltd.', capacity: '200 Kwp', location: 'Katni' },
    { name: 'Vindhya Paper Pvt. Ltd.', capacity: '180 Kwp', location: 'Satna' },
    { name: 'Mahakoshi Padmawati Cold Storage', capacity: '104 Kwp', location: 'Rewa' },
    { name: 'Pragati Foods', capacity: '864 Kwp', location: 'Hosangabad' },
    { name: 'MNK Industries Pvt. Ltd.', capacity: '360 Kwp', location: 'Hosangabad' },
    { name: 'Greenco Industries', capacity: '12280 Kwp', location: 'Satna' }
  ],
  institutional: [
    { name: 'AKS University', capacity: '100 Kwp', location: 'Satna' },
    { name: 'Arogya Dham Chitrakoot', capacity: '150 Kwp', location: 'Satna' },
    { name: 'Gyansithali School', capacity: '75 Kwp', location: 'Rewa' },
    { name: 'DPS School Satna', capacity: '55 Kwp', location: 'Satna' },
    { name: 'Royal Shravan Johnson', capacity: '50 Kwp', location: 'Rewa' },
    { name: 'Hotel Shirai a INN', capacity: '50 Kwp', location: 'Satna' },
    { name: 'Hotel Shark-in Resort', capacity: '35 Kwp', location: 'Satna' },
    { name: 'Hotel Central Landmark', capacity: '30 Kwp', location: 'Katni' },
    { name: 'Hotel Sangam Bela Resort', capacity: '25 Kwp', location: 'Satna' },
    { name: 'M.G.M Hospital', capacity: '50 Kwp', location: 'Jabalpur' },
    { name: 'Agarawal Motors', capacity: '45 Kwp', location: 'Rewa' },
    { name: 'TT Steel', capacity: '40 Kwp', location: 'Chhatarpur' },
    { name: 'Birla ITI', capacity: '35 Kwp', location: 'Katni' },
    { name: 'Parmannad Hospital', capacity: '30 Kwp', location: 'Shahdol' }
  ],
  domestic: {
    clients: '300+',
    locations: 'Rewa, Satna, Katni, Shahdol & nearby',
    note: 'Satisfied homeowners enjoying solar savings'
  }
};

/**
 * Home page
 * GET /
 */
function renderHome(req, res) {
  res.render('index', { portfolio: portfolioData });
}

/**
 * Services page
 * GET /services
 */
function renderServices(req, res) {
  res.render('services');
}

/**
 * Portfolio page
 * GET /portfolio
 */
function renderPortfolio(req, res) {
  res.render('portfolio', { portfolio: portfolioData });
}

/**
 * About page
 * GET /about
 */
function renderAbout(req, res) {
  res.render('about');
}

/**
 * Contact page
 * GET /contact
 */
function renderContact(req, res) {
  res.render('contact', { success: false, error: null });
}

/**
 * Handle contact form submission
 * POST /contact
 */
async function submitContact(req, res, next) {
  try {
    const { name, phone, email, location, serviceType, message } = req.body;

    console.log('[ContactForm] Submission received:', { name, phone, email, location, serviceType });

    // Create lead
    const db = require('../../config/database');
    const lead = await db.createLead({
      name: name?.trim() || 'Unknown',
      phone: phone?.trim() || '',
      email: email?.trim() || null,
      location: location?.trim() || null,
      serviceType: serviceType?.trim() || null,
      message: message?.trim() || null,
      priority: 'medium',
      source: 'website'
    });

    console.log('[ContactForm] Lead created successfully:', lead.lead_id);

    // Send email notification (non-blocking)
    mailer.notifyAdminNewContact({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      location: lead.location,
      serviceType: lead.service_type,
      message: lead.message
    }).catch(err => console.error('Contact email failed:', err.message));

    // For AJAX requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Thank you! We will contact you soon.' });
    }

    res.render('contact', {
      success: true,
      error: null,
      message: 'Thank you! We will contact you soon.'
    });
  } catch (error) {
    console.error('[ContactForm] ERROR saving lead:', error.message);
    // For AJAX requests, return JSON error
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Failed to save your request. Please try again or call us directly.' });
    }
    // For normal form submission, render contact page with error
    res.render('contact', {
      success: false,
      error: 'We could not save your request at this time. Please try again or contact us directly.',
      message: null
    });
  }
}

/**
 * Handle callback request
 * POST /api/callback
 */
async function submitCallback(req, res, next) {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Valid phone number required' });
    }

    console.log('[Callback] Request received:', phone);

    const db = require('../../config/database');
    const lead = await db.createLead({
      name: 'Callback Request',
      phone: phone.trim(),
      serviceType: 'Callback Request',
      priority: 'high',
      source: 'callback'
    });

    console.log('[Callback] Lead created:', lead.lead_id);

    // Send email (non-blocking)
    mailer.notifyAdminNewCallback(phone.trim()).catch(err => {
      console.error('Callback email failed:', err.message);
    });

    res.json({ success: true, message: 'We will call you back soon!' });
  } catch (error) {
    console.error('[Callback] ERROR saving lead:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save callback request. Please try again or call us directly.' });
  }
}

/**
 * Solar Types page
 * GET /solar-types
 */
function renderSolarTypes(req, res) {
  res.render('solar-types');
}

/**
 * Solar Calculator page
 * GET /solar-calculator
 */
function renderSolarCalculator(req, res) {
  res.render('solar-calculator');
}

/**
 * Government Subsidy Calculator page
 * GET /subsidy-calculator
 */
function renderSubsidyCalculator(req, res) {
  res.render('subsidy-calculator');
}

/**
 * ROI Calculator page
 * GET /roi-calculator
 */
function renderROICalculator(req, res) {
  res.render('roi-calculator');
}

/**
 * EMI Estimator page
 * GET /emi-estimator
 */
function renderEMIEstimator(req, res) {
  res.render('emi-estimator');
}

/**
 * Solar Bhopal page
 * GET /solar-bhopal
 */
function renderSolarBhopal(req, res) {
  res.render('solar-bhopal');
}

/**
 * Solar Indore page
 * GET /solar-indore
 */
function renderSolarIndore(req, res) {
  res.render('solar-indore');
}

/**
 * Blog page
 * GET /blog
 */
function renderBlog(req, res) {
  res.render('blog');
}

/**
 * Solar Subsidy Information page
 * GET /solar-subsidy-info
 */
function renderSolarSubsidyInfo(req, res) {
  res.render('solar-subsidy-info');
}

/**
 * Case Studies page
 * GET /case-studies
 */
function renderCaseStudies(req, res) {
  res.render('case-studies');
}

module.exports = {
  renderHome,
  renderServices,
  renderPortfolio,
  renderAbout,
  renderContact,
  renderSolarTypes,
  renderSolarCalculator,
  renderSubsidyCalculator,
  renderROICalculator,
  renderEMIEstimator,
  renderSolarBhopal,
  renderSolarIndore,
  renderBlog,
  renderSolarSubsidyInfo,
  renderCaseStudies,
  submitContact,
  submitCallback,
  portfolioData
};
