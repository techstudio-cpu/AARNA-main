const db = require('./database');

// Simple audit logging that works with PostgreSQL
async function addAuditEntry(action, userId, details = {}) {
  try {
    // Handle both user.id and user.user_id formats
    // If userId is an object (from file-based auth), extract the correct ID
    let actualUserId = userId;
    if (typeof userId === 'object' && userId !== null) {
      actualUserId = userId.user_id || userId.id;
    }
    
    await db.addAuditLog(action, actualUserId, {
      ...details,
      ip: details.ip || null,
      userAgent: details.userAgent || null
    });
  } catch (error) {
    console.error('Failed to add audit entry:', error.message);
  }
}

module.exports = {
  addAuditEntry
};
