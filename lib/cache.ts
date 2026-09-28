const cache = new Map<string, number>();

export function checkAndStoreNonce(nonce: string, ttlSeconds: number): boolean {
  const now = Date.now();
  // Cleanup expired
  for (const [key, expiry] of cache.entries()) {
    if (now > expiry) {
      cache.delete(key);
    }
  }

  if (cache.has(nonce)) {
    return false; // Replay detected
  }
  
  cache.set(nonce, now + (ttlSeconds * 1000));
  return true;
}
