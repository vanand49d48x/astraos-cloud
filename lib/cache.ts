import { prisma } from "./db";
import crypto from "crypto";

/**
 * Postgres-backed TTL cache for STAC search results.
 * Serverless instances (Vercel) don't share memory, so we use the DB as the cache layer.
 * Optional: add an in-memory L1 cache on top for hot-path performance within a single invocation.
 */

// L1 in-memory cache (per-invocation only — not shared across serverless instances)
const l1Cache = new Map<string, { data: unknown; expiresAt: number }>();
const L1_MAX_SIZE = 50;

/**
 * Generate a deterministic cache key from search parameters.
 */
export function computeCacheKey(params: Record<string, unknown>): string {
  // Normalize: sort keys, round bbox to 4 decimal places, sort collections
  const normalized: Record<string, unknown> = {};

  const keys = Object.keys(params).sort();
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null) continue;

    if (key === "bbox" && Array.isArray(value)) {
      normalized[key] = value.map((v: number) => Math.round(v * 10000) / 10000);
    } else if (key === "collections" && Array.isArray(value)) {
      normalized[key] = [...value].sort();
    } else {
      normalized[key] = value;
    }
  }

  const json = JSON.stringify(normalized);
  return crypto.createHash("sha256").update(json).digest("hex");
}

/**
 * Get a cached response. Checks L1 in-memory first, then Postgres.
 */
export async function getCached<T>(cacheKey: string): Promise<T | null> {
  // L1 check
  const l1Entry = l1Cache.get(cacheKey);
  if (l1Entry && l1Entry.expiresAt > Date.now()) {
    return l1Entry.data as T;
  }
  l1Cache.delete(cacheKey);

  // Postgres check
  try {
    const row = await prisma.stacCache.findUnique({
      where: { cacheKey },
    });

    if (!row) return null;

    if (row.expiresAt < new Date()) {
      // Expired — delete asynchronously
      prisma.stacCache.delete({ where: { cacheKey } }).catch(() => {});
      return null;
    }

    // Populate L1
    setL1(cacheKey, row.responseJson, row.expiresAt.getTime());

    return row.responseJson as T;
  } catch {
    // DB might not be connected (dev without DB) — return null gracefully
    return null;
  }
}

/**
 * Set a cached response in both L1 and Postgres.
 */
export async function setCache(
  cacheKey: string,
  request: Record<string, unknown>,
  response: unknown,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // L1 set
  setL1(cacheKey, response, expiresAt.getTime());

  // Postgres upsert
  try {
    await prisma.stacCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        requestJson: request as any,
        responseJson: response as any,
        expiresAt,
      },
      update: {
        responseJson: response as any,
        expiresAt,
        updatedAt: new Date(),
      },
    });
  } catch {
    // DB not connected — L1 only
  }
}

/**
 * Clean up expired cache entries. Called periodically by cron.
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const result = await prisma.stacCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  } catch {
    return 0;
  }
}

function setL1(key: string, data: unknown, expiresAt: number) {
  // Evict oldest if at capacity
  if (l1Cache.size >= L1_MAX_SIZE) {
    const firstKey = l1Cache.keys().next().value;
    if (firstKey) l1Cache.delete(firstKey);
  }
  l1Cache.set(key, { data, expiresAt });
}
