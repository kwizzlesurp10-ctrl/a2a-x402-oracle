type ReplayEntry = { status: "pending" | "consumed"; expiresAt: number };

const PENDING_TTL_MS = 120_000;
const CONSUMED_TTL_MS = 120_000;

const replayCache = new Map<string, ReplayEntry>();

function purgeExpiredReplayEntries(now = Date.now()): void {
  for (const [key, entry] of replayCache.entries()) {
    if (now > entry.expiresAt) replayCache.delete(key);
  }
}

/** Reserve a payment signature while verify/settle runs; blocks concurrent reuse. */
export function beginPaymentReplayGuard(replayKey: string): boolean {
  purgeExpiredReplayEntries();
  if (replayCache.has(replayKey)) return false;
  replayCache.set(replayKey, { status: "pending", expiresAt: Date.now() + PENDING_TTL_MS });
  return true;
}

/** After successful settle — keep blocked for replay window. */
export function consumePaymentReplayGuard(replayKey: string): void {
  replayCache.set(replayKey, { status: "consumed", expiresAt: Date.now() + CONSUMED_TTL_MS });
}

/** On failed verify or failed settle — allow a legitimate retry with the same authorization. */
export function releasePaymentReplayGuard(replayKey: string): void {
  const entry = replayCache.get(replayKey);
  if (entry?.status === "pending") replayCache.delete(replayKey);
}

export function clearPaymentReplayGuardsForTests(): void {
  replayCache.clear();
}