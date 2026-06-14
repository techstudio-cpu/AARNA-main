/**
 * Cache Utility
 * Simple in-memory cache with TTL for leads and other frequently accessed data
 */

// Cache store
const cache = new Map();

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null
 */
function get(key) {
  const item = cache.get(key);
  if (!item) return null;

  // Check if expired
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Set cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds
 */
function set(key, value, ttlMs = 5 * 60 * 1000) {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlMs
  });
}

/**
 * Delete cached value
 * @param {string} key - Cache key
 */
function del(key) {
  cache.delete(key);
}

/**
 * Clear all cache
 */
function clear() {
  cache.clear();
}

/**
 * Get cache stats
 * @returns {Object} Cache statistics
 */
function stats() {
  let valid = 0;
  let expired = 0;

  for (const [key, item] of cache.entries()) {
    if (Date.now() > item.expiry) {
      expired++;
    } else {
      valid++;
    }
  }

  return {
    total: cache.size,
    valid,
    expired,
    keys: Array.from(cache.keys())
  };
}

// Specific cache operations for leads
const LEADS_CACHE_KEY = 'leads:all';

function getCachedLeads() {
  return get(LEADS_CACHE_KEY);
}

function setCachedLeads(leads, ttlMs = 5 * 60 * 1000) {
  set(LEADS_CACHE_KEY, leads, ttlMs);
}

function refreshLeadsCache() {
  del(LEADS_CACHE_KEY);
}

module.exports = {
  get,
  set,
  del,
  clear,
  stats,
  getCachedLeads,
  setCachedLeads,
  refreshLeadsCache
};
