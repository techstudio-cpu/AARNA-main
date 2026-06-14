/**
 * Admin Routes
 * Admin panel routes (protected)
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../../config/database');

// Helper function to get common admin data
async function getAdminData() {
  const stats = await db.getLeadsStats();
  const leadsSample = await db.getLeadsPaginated({ limit: 1000 });
  const serviceTypes = [...new Set(leadsSample.data.map(c => c.service_type || 'Not specified'))];
  const assignees = [...new Set(leadsSample.data.map(c => c.assigned_to).filter(Boolean))];

  return {
    stats: {
      totalLeads: stats.total_leads,
      newLeads: stats.new_leads,
      contacted: stats.contacted,
      qualified: stats.qualified,
      proposal: stats.proposal,
      negotiation: stats.negotiation,
      converted: stats.converted,
      lost: stats.lost,
      leadsGrowth: 12,
      convertedLeads: stats.converted,
      conversionRate: stats.total_leads > 0 ? Math.round((stats.converted / stats.total_leads) * 100) : 0,
      quotesGenerated: stats.proposal,
      quotesGrowth: 8,
      pendingFollowUps: stats.contacted + stats.qualified
    },
    serviceTypes,
    assignees
  };
}

// Admin Dashboard
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const adminData = await getAdminData();
    const leads = await db.getLeadsPaginated({ limit: 10 });
    
    // Generate pipeline data
    const pipelineStages = [
      { name: 'New', count: adminData.stats.newLeads, leads: leads.data.filter(l => l.status === 'new').slice(0, 3) },
      { name: 'Contacted', count: adminData.stats.contacted, leads: leads.data.filter(l => l.status === 'contacted').slice(0, 3) },
      { name: 'Qualified', count: adminData.stats.qualified, leads: leads.data.filter(l => l.status === 'qualified').slice(0, 3) },
      { name: 'Proposal', count: adminData.stats.proposal, leads: leads.data.filter(l => l.status === 'proposal').slice(0, 3) },
      { name: 'Negotiation', count: adminData.stats.negotiation, leads: leads.data.filter(l => l.status === 'negotiation').slice(0, 3) },
      { name: 'Converted', count: adminData.stats.converted, leads: leads.data.filter(l => l.status === 'converted').slice(0, 3) }
    ];

    // Generate recent activities
    const recentActivities = leads.data.slice(0, 5).map(lead => ({
      icon: lead.status === 'new' ? '🆕' : lead.status === 'converted' ? '✅' : '📞',
      text: `Lead ${lead.name} - ${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}`,
      time: lead.created_at ? `${Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60))}h ago` : 'Just now'
    }));

    res.render('admin/dashboard', {
      ...adminData,
      pipelineStages,
      recentActivities,
      adminUser: req.currentUser.displayName,
      userRole: req.currentUser.role,
      activePage: 'dashboard',
      canEdit: req.currentUser.role !== 'viewer'
    });
  } catch (error) {
    next(error);
  }
});

// Admin Leads
router.get('/leads', requireAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    const adminData = await getAdminData();
    const leadsResult = await db.getLeadsPaginated({ limit, offset });
    
    res.render('admin/leads', {
      ...adminData,
      leads: leadsResult.data,
      totalLeads: leadsResult.total,
      currentPage: page,
      pageSize: limit,
      adminUser: req.currentUser.displayName,
      userRole: req.currentUser.role,
      activePage: 'leads',
      canEdit: req.currentUser.role !== 'viewer'
    });
  } catch (error) {
    next(error);
  }
});

// Admin Quotations
router.get('/quotations', requireAuth, async (req, res, next) => {
  try {
    const adminData = await getAdminData();
    
    res.render('admin/quotations', {
      ...adminData,
      adminUser: req.currentUser.displayName,
      userRole: req.currentUser.role,
      activePage: 'quotations',
      canEdit: req.currentUser.role !== 'viewer'
    });
  } catch (error) {
    next(error);
  }
});

// Admin Analytics
router.get('/analytics', requireAuth, async (req, res, next) => {
  try {
    const adminData = await getAdminData();
    
    // Generate analytics data
    const analytics = {
      totalLeads: adminData.stats.totalLeads,
      leadsChange: 12,
      conversionRate: adminData.stats.conversionRate,
      conversionChange: 5,
      revenue: adminData.stats.converted * 150000,
      revenueChange: 18,
      avgResponseTime: 2,
      responseTimeChange: -15,
      leadTrends: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [45, 52, 48, 61, 55, 67]
      },
      conversionFunnel: {
        labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Converted'],
        data: [adminData.stats.newLeads, adminData.stats.contacted, adminData.stats.qualified, adminData.stats.proposal, adminData.stats.negotiation, adminData.stats.converted]
      },
      revenueDistribution: {
        labels: ['Residential', 'Commercial', 'Industrial'],
        data: [65, 25, 10]
      },
      serviceTypes: {
        labels: adminData.serviceTypes.slice(0, 5),
        data: [40, 25, 15, 12, 8]
      },
      geographicDistribution: {
        labels: ['Bhopal', 'Indore', 'Jabalpur', 'Rewa', 'Other'],
        data: [35, 25, 15, 10, 15]
      }
    };

    const performanceMetrics = [
      { name: 'Lead Response Time', current: '2.1h', previous: '2.5h', change: -16, trend: 'up' },
      { name: 'Lead Conversion Rate', current: '18.5%', previous: '17.2%', change: 7.5, trend: 'up' },
      { name: 'Quote Acceptance Rate', current: '42.3%', previous: '38.7%', change: 9.3, trend: 'up' },
      { name: 'Average Deal Size', current: '₹1.8L', previous: '₹1.6L', change: 12.5, trend: 'up' },
      { name: 'Customer Satisfaction', current: '4.7/5', previous: '4.5/5', change: 4.4, trend: 'up' }
    ];

    res.render('admin/analytics', {
      ...adminData,
      analytics,
      performanceMetrics,
      adminUser: req.currentUser.displayName,
      userRole: req.currentUser.role,
      activePage: 'analytics'
    });
  } catch (error) {
    next(error);
  }
});

// Admin Settings
router.get('/settings', requireAuth, async (req, res, next) => {
  try {
    const adminData = await getAdminData();
    
    // Get users if super admin
    let users = [];
    if (req.currentUser.role === 'super_admin') {
      users = await db.getAllUsers();
    }

    res.render('admin/settings', {
      ...adminData,
      users,
      currentUserId: req.currentUser.id,
      adminUser: req.currentUser.displayName,
      userRole: req.currentUser.role,
      activePage: 'settings',
      auditLogs: [],
      totalAuditLogs: 0,
      auditPage: 1,
      sessions: []
    });
  } catch (error) {
    next(error);
  }
});

// Legacy admin route - redirects to dashboard
router.get('/', requireAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

// Pipeline route - redirects to dashboard (Kanban pipeline feature not yet implemented)
router.get('/pipeline', requireAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;
