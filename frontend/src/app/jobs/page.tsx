"use client";

import { useState, useEffect }      from "react";
import Link                          from "next/link";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem, type AbiEvent } from "viem";
import { Search, Plus }              from "lucide-react";
import { JobCard }                   from "@/components/jobs/JobCard";
import { formatUsdc }                from "@/lib/utils";
import { cn }                        from "@/lib/utils";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI } from "@/lib/contracts";
import { fetchIdsWithCache }         from "@/lib/eventCache";
import type { Job }                  from "@/types";
import { JobStatus }                 from "@/types";

// ─── Filter options ───────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "all",       label: "All Jobs"    },
  { value: "open",      label: "Open"        },
  { value: "progress",  label: "In Progress" },
  { value: "completed", label: "Completed"   },
];

const JOB_CREATED_EVENT = parseAbiItem(
  "event JobCreated(bytes32 indexed jobId, address indexed employer, uint256 budget, string title)"
) as AbiEvent;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // ── Step 1: fetch all JobCreated event logs ──────────────────────────────
  const publicClient = usePublicClient();
  const [jobIds, setJobIds]     = useState<`0x${string}`[]>([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESSES.jobRegistry) return;

    fetchIdsWithCache(
      publicClient,
      CONTRACT_ADDRESSES.jobRegistry,
      JOB_CREATED_EVENT,
      "jobs",
      (cached) => setJobIds(cached),   // show cached immediately
    )
      .then(setJobIds)
      .catch(console.error)
      .finally(() => setLogsLoaded(true));
  }, [publicClient]);

  // ── Step 2: batch-read full job structs ──────────────────────────────────
  const { data: jobsData, isLoading: jobsReading } = useReadContracts({
    contracts: jobIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getJob",
      args:         [id],
    })),
    query: { enabled: jobIds.length > 0 },
  });

  // ── Step 3: map to Job[] ─────────────────────────────────────────────────
  const jobs: Job[] = (jobsData ?? [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => r.result as unknown as Job);

  const isLoading = !logsLoaded || jobsReading;

  // ── Filtering + search ───────────────────────────────────────────────────
  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.requiredSkills?.some((s) => s.toLowerCase().includes(q)) ||
      job.description?.toLowerCase().includes(q);

    const matchFilter =
      filter === "all"       ? true :
      filter === "open"      ? job.status === JobStatus.Open :
      filter === "progress"  ? (job.status === JobStatus.InProgress || job.status === JobStatus.Submitted || job.status === JobStatus.Assigned) :
      filter === "completed" ? job.status === JobStatus.Completed : true;

    return matchSearch && matchFilter;
  });

  const totalBudget = filtered.reduce((acc, j) => acc + (j.budget ?? 0n), 0n);

  const NEU      = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
  const NEU_INSET = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
  const NEU_SM    = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1
            className="text-3xl tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
          >
            Job Board
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
            {isLoading ? (
              <span className="animate-pulse">Loading jobs...</span>
            ) : (
              <>
                <span style={{ color: "#3D4852", fontWeight: 600 }}>{filtered.length}</span> jobs found
                {totalBudget > 0n && (
                  <> · <span style={{ color: "#6C63FF", fontWeight: 600 }}>{formatUsdc(totalBudget)} USDC</span> total</>
                )}
              </>
            )}
          </p>
        </div>
        <Link href="/jobs/post" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Post Job
        </Link>
      </div>

      {/* ── Search + Filter bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#8B95A5" }} />
          <input
            type="text"
            placeholder="Search jobs by title, skill, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300"
            style={{
              background: "#E0E5EC",
              color: "#3D4852",
              boxShadow: NEU_INSET,
            }}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="px-4 py-2.5 text-[13px] rounded-2xl border-0 cursor-pointer transition-all duration-300"
              style={{
                fontWeight: filter === value ? 700 : 500,
                color:      filter === value ? "#6C63FF" : "#6B7280",
                background: "#E0E5EC",
                boxShadow:  filter === value ? NEU_INSET : NEU_SM,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Job grid ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[14px] animate-pulse mb-2" style={{ color: "#6B7280" }}>
            Loading on-chain job data...
          </div>
          <div className="text-[12px]" style={{ color: "#8B95A5" }}>Querying Arc Testnet (chain ID 5042002)</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[16px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>
            {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your search"}
          </div>
          <div className="text-[14px]" style={{ color: "#6B7280" }}>
            {jobs.length === 0
              ? <Link href="/jobs/post" style={{ color: "#6C63FF" }}>Post the first job →</Link>
              : "Try a different search or clear your filters"
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((job) => (
            <JobCard key={job.jobId} job={job} />
          ))}
        </div>
      )}

      {/* Chain badge */}
      <p className="text-center text-[12px] mt-10" style={{ color: "#8B95A5" }}>
        Live data from Arc Testnet · Chain ID 5042002 · {jobs.length} jobs indexed
      </p>
    </div>
  );
}
