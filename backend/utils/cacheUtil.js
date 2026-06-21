class CacheUtil {
  constructor(defaultTtlMs = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + ttlMs;
    // Simple eviction policy if cache grows too large
    if (this.cache.size >= 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt });
  }

  clear() {
    this.cache.clear();
  }
}

const chatCache = new CacheUtil();
export default chatCache;
export { CacheUtil };
