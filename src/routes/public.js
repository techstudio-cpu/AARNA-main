/**
 * Public Routes
 * Website pages and public forms
 */

const express = require('express');
const router = express.Router();
const { publicLimiter } = require('../../config/security');
const {
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
  submitContact
} = require('../controllers/publicController');

// Public pages
router.get('/', renderHome);
router.get('/services', renderServices);
router.get('/portfolio', renderPortfolio);
router.get('/about', renderAbout);
router.get('/contact', renderContact);
router.get('/solar-types', renderSolarTypes);
router.get('/solar-calculator', renderSolarCalculator);
router.get('/subsidy-calculator', renderSubsidyCalculator);
router.get('/roi-calculator', renderROICalculator);
router.get('/emi-estimator', renderEMIEstimator);
router.get('/solar-bhopal', renderSolarBhopal);
router.get('/solar-indore', renderSolarIndore);
router.get('/blog', renderBlog);
router.get('/solar-subsidy-info', renderSolarSubsidyInfo);
router.get('/case-studies', renderCaseStudies);

// Contact form submission (rate limited)
router.post('/contact', publicLimiter, submitContact);

module.exports = router;
