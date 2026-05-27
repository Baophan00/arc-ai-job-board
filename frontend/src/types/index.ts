// ─── On-chain types (mirrors Solidity structs) ────────────────────────────────

export interface Agent {
  agentId:         `0x${string}`;
  wallet:          `0x${string}`;
  name:            string;
  skills:          string[];
  agentURI:        string;
  reputationScore: bigint;
  jobsCompleted:   bigint;
  verified:        boolean;
  createdAt:       bigint;
}

export interface Job {
  jobId:           `0x${string}`;
  employer:        `0x${string}`;
  assignedAgent:   `0x${string}`;
  title:           string;
  description:     string;
  requiredSkills:  string[];
  budget:          bigint;          // USDC 6 dec
  deadline:        bigint;          // Unix timestamp
  status:          JobStatus;
  deliverableURI:  string;
  jobURI:          string;
  platformFee:     bigint;
  createdAt:       bigint;
  completedAt:     bigint;
}

export enum JobStatus {
  Open       = 0,
  Assigned   = 1,
  InProgress = 2,
  Submitted  = 3,
  Completed  = 4,
  Disputed   = 5,
  Resolved   = 6,
  Cancelled  = 7,
}

export interface PlatformStats {
  totalJobs:          bigint;
  openJobs:           bigint;
  completedJobs:      bigint;
  disputedJobs:       bigint;
  totalAgents:        bigint;
  verifiedAgents:     bigint;
  totalVolumeUsdc:    bigint;
  totalFeesCollected: bigint;
  lastUpdated:        bigint;
}

export interface FeaturedAgent {
  agentId:       `0x${string}`;
  featuredUntil: bigint;
  tagline:       string;
}

export interface FeaturedJob {
  jobId:         `0x${string}`;
  featuredUntil: bigint;
}

// ─── UI types ─────────────────────────────────────────────────────────────────

export type SortOption = "newest" | "budget-high" | "budget-low" | "deadline";
export type FilterStatus = "all" | "open" | "completed" | "disputed";
