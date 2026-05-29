/**
 * localStorage cache for blockchain event IDs.
 *
 * Strategy:
 * 1. First load: scan all blocks from DEPLOY_BLOCK → latest (slow, ~5s)
 * 2. Save IDs + last scanned block to localStorage
 * 3. Next load: return cached IDs immediately (instant), then scan only
 *    from last scanned block → latest (fast, 1–2 RPC calls)
 * 4. Merge new IDs into cache
 */

import type { PublicClient, AbiEvent } from "viem";
import { parseAbiItem }               from "viem";

const DEPLOY_BLOCK = 44_380_000n;
const CHUNK_SIZE   = 9_000n;
/** Cache TTL: re-scan for new events every 30s even if cached */
const POLL_INTERVAL_MS = 30_000;

interface Cache {
  ids:           string[];
  lastBlock:     string;   // bigint serialised as string
  cachedAt:      number;   // Date.now()
}

function cacheKey(label: string) {
  return `agentcywork:${label}:v1`;
}

function readCache(label: string): Cache | null {
  try {
    const raw = localStorage.getItem(cacheKey(label));
    if (!raw) return null;
    return JSON.parse(raw) as Cache;
  } catch {
    return null;
  }
}

function writeCache(label: string, cache: Cache) {
  try {
    localStorage.setItem(cacheKey(label), JSON.stringify(cache));
  } catch {
    // storage full or SSR — ignore
  }
}

async function scanRange(
  client: PublicClient,
  address: `0x${string}`,
  event: AbiEvent,
  from: bigint,
  to: bigint
): Promise<`0x${string}`[]> {
  const ids: `0x${string}`[] = [];
  let cursor = from;
  while (cursor <= to) {
    const end = cursor + CHUNK_SIZE - 1n < to ? cursor + CHUNK_SIZE - 1n : to;
    const logs = await client.getLogs({ address, event, fromBlock: cursor, toBlock: end });
    for (const l of logs) {
      const args = l.args as Record<string, unknown>;
      const id = args[Object.keys(args)[0]];
      if (id) ids.push(id as `0x${string}`);
    }
    cursor = end + 1n;
  }
  return ids;
}

/**
 * Fetch event IDs with localStorage caching.
 *
 * @param client   viem PublicClient
 * @param address  Contract address
 * @param event    Parsed ABI event (parseAbiItem result)
 * @param label    Cache key label, e.g. "jobs" or "agents"
 * @param onPartial Called immediately with cached IDs (before new scan)
 * @returns        Final deduplicated ID array (newest first)
 */
export async function fetchIdsWithCache(
  client: PublicClient,
  address: `0x${string}`,
  event: AbiEvent,
  label: string,
  onPartial?: (ids: `0x${string}`[]) => void
): Promise<`0x${string}`[]> {
  const latest  = await client.getBlockNumber();
  const cache   = readCache(label);
  const now     = Date.now();

  // ── Serve cached IDs immediately ──────────────────────────────────────────
  if (cache && cache.ids.length > 0) {
    onPartial?.(cache.ids as `0x${string}`[]);

    // If cache is fresh enough, skip re-scan
    if (now - cache.cachedAt < POLL_INTERVAL_MS) {
      return cache.ids as `0x${string}`[];
    }
  }

  // ── Determine scan range ──────────────────────────────────────────────────
  const fromBlock = cache
    ? BigInt(cache.lastBlock) + 1n   // incremental: only new blocks
    : DEPLOY_BLOCK;                   // first time: full scan

  let newIds: `0x${string}`[] = [];
  if (fromBlock <= latest) {
    newIds = await scanRange(client, address, event, fromBlock, latest);
  }

  // ── Merge + deduplicate ───────────────────────────────────────────────────
  const existingSet = new Set(cache?.ids ?? []);
  for (const id of newIds) existingSet.add(id);

  // Keep original order (oldest first) then reverse for newest-first display
  const merged = Array.from(existingSet) as `0x${string}`[];

  writeCache(label, {
    ids:       merged,
    lastBlock: latest.toString(),
    cachedAt:  now,
  });

  return merged.slice().reverse();
}
