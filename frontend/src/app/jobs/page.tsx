"use client";

import { useState }   from "react";
import Link            from "next/link";
import { JobCard }     from "@/components/jobs/JobCard";
import { formatUsdc }  from "@/lib/utils";
import { cn }          from "@/lib/utils";
import type { Job }    from "@/types";
import { JobStatus }   from "@/types";

// ─── Filter options ───────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "all",       label: "ALL_JOBS"    },
  { value: "open",      label: "OPEN"        },
  { value: "progress",  label: "IN_PROGRESS" },
  { value: "completed", label: "COMPLETED"   },
];

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_JOBS: Job[] = [
  {
    jobId:          "0x1a2b3c" as `0x${string}`,
    employer:       "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as `0x${string}`,
    assignedAgent:  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    title:          "Build a DeFi yield optimiser agent",
    description:
      "Implement an AI agent that monitors multiple DeFi protocols on Arc and automatically reallocates USDC to the highest yield strategy.",
    requiredSkills: ["DeFi", "Solidity", "Python", "Arc Chain"],
    budget:         BigInt(500_000_000),
    deadline:       BigInt(Math.floor(Date.now() / 1000) + 7 * 86400),
    status:         JobStatus.Open,
    deliverableURI: "",
    jobURI:         "ipfs://Qm...",
    platformFee:    BigInt(12_500_000),
    createdAt:      BigInt(Math.floor(Date.now() / 1000) - 3600),
    completedAt:    0n,
  },
  {
    jobId:          "0x2b3c4d" as `0x${string}`,
    employer:       "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" as `0x${string}`,
    assignedAgent:  "0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`,
    title:          "Natural Language Smart Contract Auditor",
    description:
      "Create an AI agent that reads Solidity code, identifies common vulnerabilities (reentrancy, overflow, access control) and outputs a structured report.",
    requiredSkills: ["Solidity", "Security", "NLP", "Auditing"],
    budget:         BigInt(1_200_000_000),
    deadline:       BigInt(Math.floor(Date.now() / 1000) + 14 * 86400),
    status:         JobStatus.InProgress,
    deliverableURI: "",
    jobURI:         "",
    platformFee:    BigInt(30_000_000),
    createdAt:      BigInt(Math.floor(Date.now() / 1000) - 86400),
    completedAt:    0n,
  },
  {
    jobId:          "0x3c4d5e" as `0x${string}`,
    employer:       "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5" as `0x${string}`,
    assignedAgent:  "0x0000000000000000000000000000000000000000000000000000000000000002" as `0x${string}`,
    title:          "On-chain Data Summarisation Agent",
    description:
      "Build an MCP-compatible agent that reads Arc on-chain events and produces human-readable summaries for a Notion workspace integration.",
    requiredSkills: ["Arc", "MCP", "TypeScript", "Data Analysis"],
    budget:         BigInt(300_000_000),
    deadline:       BigInt(Math.floor(Date.now() / 1000) + 5 * 86400),
    status:         JobStatus.Open,
    deliverableURI: "",
    jobURI:         "",
    platformFee:    BigInt(7_500_000),
    createdAt:      BigInt(Math.floor(Date.now() / 1000) - 7200),
    completedAt:    0n,
  },
  {
    jobId:          "0x4d5e6f" as `0x${string}`,
    employer:       "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`,
    assignedAgent:  "0x0000000000000000000000000000000000000000000000000000000000000003" as `0x${string}`,
    title:          "USDC Payments Reconciliation Agent",
    description:
      "Agent that listens to Circle CCTP events on Arc and reconciles cross-chain USDC transfers for accounting purposes.",
    requiredSkills: ["CCTP", "Circle", "Accounting", "Python"],
    budget:         BigInt(800_000_000),
    deadline:       BigInt(Math.floor(Date.now() / 1000) + 10 * 86400),
    status:         JobStatus.Completed,
    deliverableURI: "ipfs://QmCompletedWork",
    jobURI:         "",
    platformFee:    BigInt(20_000_000),
    createdAt:      BigInt(Math.floor(Date.now() / 1000) - 5 * 86400),
    completedAt:    BigInt(Math.floor(Date.now() / 1000) - 86400),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const jobs = DEMO_JOBS;

  const filtered = jobs.filter((job) => {
    const matchSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      job.description.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all"       ? true :
      filter === "open"      ? job.status === JobStatus.Open :
      filter === "progress"  ? (job.status === JobStatus.InProgress || job.status === JobStatus.Submitted) :
      filter === "completed" ? job.status === JobStatus.Completed : true;

    return matchSearch && matchFilter;
  });

  const totalBudget = filtered.reduce((acc, j) => acc + j.budget, 0n);

  return (
    <div className="page-container font-mono">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="border-b border-[#1f521f] pb-4 mb-6">
        <div className="text-[9px] text-[#1f521f] mb-1 uppercase tracking-[0.2em]">
          // JOB_REGISTRY :: ERC-8183 :: BROWSE_OPEN_POSITIONS
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="section-title">Job Board</h1>
            <p className="text-[10px] text-[#1f521f] mt-1">
              {filtered.length}_jobs_found&nbsp;·&nbsp;
              <span className="text-[#33ff00]">{formatUsdc(totalBudget)}</span>_usdc_total_budget
            </p>
          </div>
          <Link href="/jobs/post" className="btn-primary self-start sm:self-auto text-[10px] py-1.5">
            + POST_JOB
          </Link>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center border border-[#1f521f] focus-within:border-[#33ff00] transition-colors px-3 py-2">
          <span className="text-[#33ff00] text-[11px] mr-2 shrink-0 font-bold">root@arc:~$</span>
          <input
            type="text"
            placeholder={'grep -r "skill" ./jobs --include="*.open"'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[#33ff00] text-[11px] placeholder:text-[#1f521f] outline-none"
          />
        </div>
      </div>

      {/* ── Status filter pills ───────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all",
              filter === value
                ? "bg-[#33ff00] border-[#33ff00] text-[#0a0a0a]"
                : "border-[#1f521f] text-[#1f521f] hover:border-[#33ff00] hover:text-[#33ff00] bg-transparent"
            )}
          >
            [{label}]
          </button>
        ))}
      </div>

      {/* ── Job grid ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="term-card">
          <div className="term-card-header">// QUERY_RESULT</div>
          <div className="term-card-body py-14 text-center">
            <div className="text-[#ff3333] text-[12px] font-bold mb-2">
              [ERR] 0 jobs matching query
            </div>
            <div className="text-[10px] text-[#1f521f]">
              try a different search or clear filters
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((job) => (
            <JobCard key={job.jobId} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
