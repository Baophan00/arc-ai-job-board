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

  if (diff < 60)      return "just_now";
  if (diff < 3600)    return `${Math.floor(diff / 60)}m_ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h_ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d_ago`;
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format deadline timestamp */
export function formatDeadline(timestamp: number | bigint): string {
  const ts  = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const now = Date.now() / 1000;
  const diff = ts - now;

  if (diff < 0)     return "EXPIRED";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m_left`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h_left`;
  return `${Math.floor(diff / 86400)}d_left`;
}

/** Reputation score → terminal colour class */
export function reputationColor(score: number | bigint): string {
  const s = typeof score === "bigint" ? Number(score) : score;
  if (s >= 80) return "text-[#33ff00]";
  if (s >= 60) return "text-[#66ff33]";
  if (s >= 40) return "text-[#ffb000]";
  return "text-[#ff3333]";
}

/** Reputation score → label */
export function reputationLabel(score: number | bigint): string {
  const s = typeof score === "bigint" ? Number(score) : score;
  if (s >= 90) return "LEGENDARY";
  if (s >= 75) return "EXCELLENT";
  if (s >= 60) return "GOOD";
  if (s >= 45) return "AVERAGE";
  if (s >= 25) return "BELOW_AVG";
  return "POOR";
}

/** Format USDC bigint (6 dec) → display string */
export function formatUsdc(amount: bigint): string {
  const v = Number(amount) / 1_000_000;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Terminal-style progress bar */
export function termBar(value: number, max = 100, width = 16): string {
  const filled = Math.round((value / max) * width);
  const empty  = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

/** Skill tag → terminal color variant (stable hash) */
export function skillColor(skill: string): string {
  const variants = [
    "text-[#33ff00] border-[#1f521f]",
    "text-[#ffb000] border-[#4a3300]",
    "text-[#66ff33] border-[#1f521f]",
    "text-[#33ff00] border-[#1f521f]",
    "text-[#ffb000] border-[#4a3300]",
  ];
  let hash = 0;
  for (let i = 0; i < skill.length; i++) hash = (hash * 31 + skill.charCodeAt(i)) & 0xffffff;
  return variants[hash % variants.length];
}
