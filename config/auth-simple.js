const db = require('./database');
const { comparePassword, hashPassword, isPasswordHashed } = require('./password');

// ─── PostgreSQL-backed user management ─────────────────────────────────
// All user data is stored in PostgreSQL to persist across Railway deployments.
// Data can only be deleted/modified by Super Admin.

// Load all users from PostgreSQL
async function loadUsers() {
  try {
    const users = await db.getAllUsers();
    // Map DB fields to app format for backward compatibility
    return users.map(u => ({
      id: u.user_id,
      username: u.username,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      active: u.active,
      createdAt: u.created_at
    }));
  } catch (e) {
    console.error('Error loading users from PostgreSQL:', e.message);
    return [];
  }
}

// Get user by ID from PostgreSQL
async function getUserById(id) {
  try {
    const user = await db.getUserById(id);
    if (!user) return null;
    return {
      id: user.user_id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      active: user.active,
      createdAt: user.created_at
    };
  } catch (e) {
    console.error('Error getting user by ID:', e.message);
    return null;
  }
}

// Authenticate user against PostgreSQL (username + password) with fallback to env vars
async function authenticateUser(username, password) {
  try {
    console.log(`🔐 Auth attempt for user: ${username}`);
    
    // Try PostgreSQL first
    const user = await db.getUserByUsername(username);
    if (!user) {
      console.log(`🔐 User not found in PostgreSQL: ${username}`);
      
      // Fallback: Check against environment variables for local development
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        console.log(`🔐 Auth success via env vars for user: ${username} (fallback mode)`);
        return {
          id: 'admin-fallback',
          username: username,
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          displayName: process.env.ADMIN_NAME || 'System Administrator',
          role: 'super_admin',
          active: true,
          createdAt: new Date().toISOString()
        };
      }
      
      console.log(`🔐 Fallback auth failed for user: ${username}`);
      return null;
    }

    // Check password - handle both hashed and legacy plaintext
    let passwordMatch = false;

    if (isPasswordHashed(user.password)) {
      // Password is hashed with bcrypt
      passwordMatch = await comparePassword(password, user.password);
    } else {
      // Legacy plaintext password - check and migrate to hash
      if (user.password === password) {
        passwordMatch = true;
        // Migrate to hashed password
        console.log(`🔐 Migrating plaintext password to hash for user: ${username}`);
        const hashedPassword = await hashPassword(password);
        await db.updateUser(user.user_id, { password: hashedPassword });
      }
    }

    if (!passwordMatch) {
      console.log(`🔐 Password mismatch for user: ${username}`);
      return null;
    }

    console.log(`🔐 Auth success for user: ${username} (role: ${user.role})`);
    // Return user without password
    return {
      id: user.user_id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      active: user.active,
      createdAt: user.created_at
    };
  } catch (e) {
    console.error('Error authenticating user:', e.message);
    
    // Fallback: Check against environment variables if PostgreSQL fails
    console.log(`🔐 PostgreSQL auth failed, trying env var fallback for user: ${username}`);
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      console.log(`🔐 Auth success via env vars for user: ${username} (fallback mode)`);
      return {
        id: 'admin-fallback',
        username: username,
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        displayName: process.env.ADMIN_NAME || 'System Administrator',
        role: 'super_admin',
        active: true,
        createdAt: new Date().toISOString()
      };
    }
    
    return null;
  }
}

// Create a new user in PostgreSQL
async function createUser(userData) {
  try {
    // Hash password if provided and not already hashed
    const userDataWithHash = { ...userData };
    if (userData.password && !isPasswordHashed(userData.password)) {
      userDataWithHash.password = await hashPassword(userData.password);
    }

    const result = await db.createUser(userDataWithHash);
    return {
      id: result.user_id,
      username: result.username,
      email: result.email,
      displayName: result.display_name,
      role: result.role,
      active: result.active,
      createdAt: result.created_at
    };
  } catch (e) {
    console.error('Error creating user:', e.message);
    throw e;
  }
}

// Update a user in PostgreSQL
async function updateUser(userId, updates) {
  try {
    // Hash password if provided and not already hashed
    const updatesWithHash = { ...updates };
    if (updates.password && !isPasswordHashed(updates.password)) {
      updatesWithHash.password = await hashPassword(updates.password);
    }

    const result = await db.updateUser(userId, updatesWithHash);
    if (!result) return null;
    return {
      id: result.user_id,
      username: result.username,
      email: result.email,
      displayName: result.display_name,
      role: result.role,
      active: result.active,
      createdAt: result.created_at
    };
  } catch (e) {
    console.error('Error updating user:', e.message);
    throw e;
  }
}

// Delete a user from PostgreSQL
async function deleteUser(userId) {
  try {
    const result = await db.deleteUser(userId);
    return result;
  } catch (e) {
    console.error('Error deleting user:', e.message);
    throw e;
  }
}

// Initialize default admin user from environment variables (PostgreSQL)
// On every startup: ensures admin exists, syncs password from env vars
async function initializeDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.warn('⚠️  ADMIN_USERNAME or ADMIN_PASSWORD env vars not set - skipping admin init');
    return null;
  }

  console.log(`🔐 Ensuring default admin user exists: ${adminUsername}`);

  try {
    // Check if admin user already exists by username
    const existingUser = await db.getUserByUsername(adminUsername);

    if (existingUser) {
      // Admin exists - sync password and ensure super_admin role + active
      console.log(`🔐 Admin user "${adminUsername}" found in DB (user_id: ${existingUser.user_id})`);

      // Always check if we need to update (password might be plaintext or need rehash)
      const isCurrentPasswordHashed = isPasswordHashed(existingUser.password);
      const passwordMatches = isCurrentPasswordHashed
        ? await comparePassword(adminPassword, existingUser.password)
        : existingUser.password === adminPassword;

      const needsUpdate = (
        !passwordMatches ||
        existingUser.role !== 'super_admin' ||
        existingUser.active !== true ||
        !isCurrentPasswordHashed  // Migrate to hash if still plaintext
      );

      if (needsUpdate) {
        // Always hash the env password when updating
        const hashedPassword = await hashPassword(adminPassword);
        await db.updateUser(existingUser.user_id, {
          password: hashedPassword,
          role: 'super_admin',
          active: true,
          displayName: process.env.ADMIN_NAME || existingUser.display_name || 'System Administrator'
        });
        console.log('✅ Admin credentials synced from environment variables (password hashed)');
      } else {
        console.log('✅ Admin credentials already up to date');
      }

      return {
        id: existingUser.user_id,
        username: existingUser.username,
        displayName: existingUser.display_name,
        role: 'super_admin'
      };
    }

    // No admin with this username - create one
    console.log(`🔐 Creating new admin user: ${adminUsername}`);
    const hashedPassword = await hashPassword(adminPassword);
    const adminUser = await db.createUser({
      username: adminUsername,
      password: hashedPassword,
      email: process.env.ADMIN_EMAIL || null,
      displayName: process.env.ADMIN_NAME || 'System Administrator',
      role: 'super_admin',
      active: true
    });

    console.log('✅ Default super admin created in PostgreSQL:', adminUser.display_name);
    return {
      id: adminUser.user_id,
      username: adminUser.username,
      displayName: adminUser.display_name,
      role: adminUser.role
    };
  } catch (e) {
    console.error('❌ Error initializing default admin:', e.message);
    console.error('   Stack:', e.stack);
    return null;
  }
}

module.exports = {
  loadUsers,
  getUserById,
  authenticateUser,
  createUser,
  updateUser,
  deleteUser,
  initializeDefaultAdmin
};
