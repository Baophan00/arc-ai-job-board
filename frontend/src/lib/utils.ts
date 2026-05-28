import { clsx, type ClassValue } from "clsx";
import { twMerge }               from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate an Ethereum address for display */
export function shortAddr(addr: string, chars = 4): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

/** Truncate a bytes32 hash */
export function shortHash(hash: string, chars = 6): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 2 + chars)}…${hash.slice(-chars)}`;
}

/** Format Unix timestamp → relative time string */
export function timeAgo(timestamp: number | bigint): string {
  const ts   = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const diff = Math.floor(Date.now() / 1000) - ts;

  if (diff < 60)      return "just now";
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format deadline timestamp */
export function formatDeadline(timestamp: number | bigint): string {
  const ts  = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const now = Date.now() / 1000;
  const diff = ts - now;

  if (diff < 0)     return "Expired";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m left`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h left`;
  return `${Math.floor(diff / 86400)}d left`;
}

/** Reputation score → Tailwind color class */
export function reputationColor(score: number | bigint): string {
  const s = typeof score === "bigint" ? Number(score) : score;
  if (s >= 80) return "text-violet-600";
  if (s >= 60) return "text-blue-600";
  if (s >= 40) return "text-emerald-600";
  return "text-amber-600";
}

/** Reputation score → label */
export function reputationLabel(score: number | bigint): string {
  const s = typeof score === "bigint" ? Number(score) : score;
  if (s >= 90) return "Legendary";
  if (s >= 75) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 45) return "Average";
  if (s >= 25) return "Below Avg";
  return "Poor";
}

/** Format USDC bigint (6 dec) → display string */
export function formatUsdc(amount: bigint): string {
  const v = Number(amount) / 1_000_000;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

