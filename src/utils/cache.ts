import NodeCache from "node-cache";

// Cache for 24 hours — anime episode lists don't change often
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

export function getCache<T>(key: string): T | undefined { return cache.get<T>(key); }
export function setCache<T>(key: string, value: T, ttl?: number): void {
  ttl !== undefined ? cache.set(key, value, ttl) : cache.set(key, value);
}
export function deleteCache(key: string): void { cache.del(key); }
export function flushCache(): void { cache.flushAll(); }

export default cache;
