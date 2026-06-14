const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure sessions file exists
if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2));
}

function loadSessions() {
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function persistSessions(sessions) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function addSession(sessionId, userId, ip, userAgent) {
  const sessions = loadSessions();
  const session = {
    id: sessionId,
    userId,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    active: true
  };
  
  sessions.push(session);
  persistSessions(sessions);
  return session;
}

function updateSessionActivity(sessionId) {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    session.lastActivity = new Date().toISOString();
    persistSessions(sessions);
  }
}

function invalidateSession(sessionId) {
  const sessions = loadSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    session.active = false;
    session.invalidatedAt = new Date().toISOString();
    persistSessions(sessions);
    return true;
  }
  return false;
}

function invalidateUserSessions(userId, exceptSessionId = null) {
  const sessions = loadSessions();
  let count = 0;
  
  sessions.forEach(session => {
    if (session.userId === userId && session.active && session.id !== exceptSessionId) {
      session.active = false;
      session.invalidatedAt = new Date().toISOString();
      count++;
    }
  });
  
  if (count > 0) {
    persistSessions(sessions);
  }
  
  return count;
}

function getActiveSessions(userId = null) {
  const sessions = loadSessions();
  return sessions.filter(s => s.active && (!userId || s.userId === userId));
}

function cleanupExpiredSessions(maxAgeHours = 24) {
  const sessions = loadSessions();
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  
  const originalLength = sessions.length;
  const active = sessions.filter(s => {
    if (!s.active) return false;
    return new Date(s.lastActivity) > cutoff;
  });
  
  if (active.length !== originalLength) {
    persistSessions(active);
  }
  
  return originalLength - active.length;
}

module.exports = {
  addSession,
  updateSessionActivity,
  invalidateSession,
  invalidateUserSessions,
  getActiveSessions,
  cleanupExpiredSessions
};
