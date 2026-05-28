"use client";

import { useState, useEffect }      from "react";
import Link                          from "next/link";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem }              from "viem";
import { Search, Plus }              from "lucide-react";
import { JobCard }                   from "@/components/jobs/JobCard";
import { formatUsdc }                from "@/lib/utils";
import { cn }                        from "@/lib/utils";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI } from "@/lib/contracts";
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
);

/** Approximate block when contracts were deployed on Arc Testnet */
const DEPLOY_BLOCK = 44_380_000n;
/** Arc Testnet limits eth_getLogs to 10,000 blocks per request */
const CHUNK_SIZE   = 9_000n;

async function fetchAllJobIds(
  client: ReturnType<typeof usePublicClient>,
  contractAddress: `0x${string}`
): Promise<`0x${string}`[]> {
  if (!client) return [];
  const latest = await client.getBlockNumber();
  const allIds: `0x${string}`[] = [];

  let from = DEPLOY_BLOCK;
  while (from <= latest) {
    const to = from + CHUNK_SIZE - 1n < latest ? from + CHUNK_SIZE - 1n : latest;
    const logs = await client.getLogs({
      address: contractAddress,
      event:   JOB_CREATED_EVENT,
      fromBlock: from,
      toBlock:   to,
    });
    for (const l of logs) {
      if (l.args.jobId) allIds.push(l.args.jobId as `0x${string}`);
    }
    from = to + 1n;
  }

  return allIds.reverse(); // newest first
}

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

    fetchAllJobIds(publicClient, CONTRACT_ADDRESSES.jobRegistry)
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-800 text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
            Job Board
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {isLoading ? (
              <span className="animate-pulse">Loading jobs...</span>
            ) : (
              <>
                <span className="text-gray-900 font-600" style={{ fontWeight: 600 }}>{filtered.length}</span> jobs found
                {totalBudget > 0n && (
                  <> · <span className="text-blue-600 font-600" style={{ fontWeight: 600 }}>{formatUsdc(totalBudget)} USDC</span> total</>
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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title, skill, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-4 py-2 text-[13px] font-500 rounded-lg border transition-all",
                filter === value
                  ? "bg-blue-500 border-blue-500 text-white font-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 bg-white"
              )}
              style={{ fontWeight: filter === value ? 600 : 500 }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Job grid ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[14px] text-gray-500 animate-pulse mb-2">
            Loading on-chain job data...
          </div>
          <div className="text-[12px] text-gray-400">Querying Arc Testnet (chain ID 5042002)</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[16px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your search"}
          </div>
          <div className="text-[14px] text-gray-500">
            {jobs.length === 0
              ? <Link href="/jobs/post" className="text-blue-500 hover:underline">Post the first job →</Link>
              : "Try a different search or clear your filters"
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.jobId} job={job} />
          ))}
        </div>
      )}

      {/* Chain badge */}
      <p className="text-center text-[12px] text-gray-400 mt-8">
        Live data from Arc Testnet · Chain ID 5042002 · {jobs.length} jobs indexed
      </p>
    </div>
  );
}
