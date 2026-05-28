"use client";

import { useState, useEffect }       from "react";
import Link                           from "next/link";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem }               from "viem";
import { Search, Plus, CheckCircle }  from "lucide-react";
import { AgentCard }                  from "@/components/agents/AgentCard";
import { cn }                         from "@/lib/utils";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import type { Agent }                 from "@/types";

// ─── Event + chunked fetch ────────────────────────────────────────────────────

const AGENT_REGISTERED_EVENT = parseAbiItem(
  "event AgentRegistered(bytes32 indexed agentId, address indexed wallet, string name)"
);

const DEPLOY_BLOCK = 44_380_000n;
const CHUNK_SIZE   = 9_000n;

async function fetchAllAgentIds(
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
      event:   AGENT_REGISTERED_EVENT,
      fromBlock: from,
      toBlock:   to,
    });
    for (const l of logs) {
      if (l.args.agentId) allIds.push(l.args.agentId as `0x${string}`);
    }
    from = to + 1n;
  }

  return allIds.reverse();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [search,   setSearch]   = useState("");
  const [verified, setVerified] = useState(false);
  const [sortBy,   setSortBy]   = useState<"reputation" | "jobs" | "newest">("reputation");

  const publicClient = usePublicClient();
  const [agentIds,    setAgentIds]    = useState<`0x${string}`[]>([]);
  const [logsLoaded,  setLogsLoaded]  = useState(false);

  // Step 1: fetch AgentRegistered events
  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESSES.agentRegistry) return;
    fetchAllAgentIds(publicClient, CONTRACT_ADDRESSES.agentRegistry)
      .then(setAgentIds)
      .catch(console.error)
      .finally(() => setLogsLoaded(true));
  }, [publicClient]);

  // Step 2: batch-read agent structs
  const { data: agentsData, isLoading: agentsReading } = useReadContracts({
    contracts: agentIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "getAgent",
      args:         [id],
    })),
    query: { enabled: agentIds.length > 0 },
  });

  const isLoading = !logsLoaded || agentsReading;

  const agents: Agent[] = (agentsData ?? [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => r.result as unknown as Agent);

  const filtered = agents
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        a.name?.toLowerCase().includes(q) ||
        a.skills?.some((s) => s.toLowerCase().includes(q));
      const matchVerified = !verified || a.verified;
      return matchSearch && matchVerified;
    })
    .sort((a, b) => {
      if (sortBy === "reputation") return Number((b.reputationScore ?? 0n) - (a.reputationScore ?? 0n));
      if (sortBy === "jobs")       return Number((b.jobsCompleted ?? 0n) - (a.jobsCompleted ?? 0n));
      return Number((b.createdAt ?? 0n) - (a.createdAt ?? 0n));
    });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-800 text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
            AI Agents
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {isLoading
              ? <span className="animate-pulse">Loading agents...</span>
              : <><span className="text-gray-900 font-600" style={{ fontWeight: 600 }}>{filtered.length}</span> agents online</>
            }
          </p>
        </div>
        <Link href="/register" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Register Agent
        </Link>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Verified toggle */}
        <button
          onClick={() => setVerified(!verified)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13px] font-500 transition-all",
            verified
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
          )}
          style={{ fontWeight: 500 }}
        >
          <CheckCircle className="h-4 w-4" />
          Verified Only
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="py-2.5 px-3 bg-gray-100 border-2 border-transparent rounded-lg text-[13px] text-gray-700 outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
        >
          <option value="reputation">Sort: Top Reputation</option>
          <option value="jobs">Sort: Most Jobs Done</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[14px] text-gray-500 animate-pulse mb-2">
            Loading on-chain agent data...
          </div>
          <div className="text-[12px] text-gray-400">Querying Arc Testnet (chain ID 5042002)</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[16px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            {agents.length === 0 ? "No agents registered yet" : "No agents match your search"}
          </div>
          <div className="text-[14px] text-gray-500">
            {agents.length === 0
              ? <Link href="/register" className="text-blue-500 hover:underline">Register the first agent →</Link>
              : "Try a different search or disable filters"
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}

      <p className="text-center text-[12px] text-gray-400 mt-8">
        Live data from Arc Testnet · Chain ID 5042002 · {agents.length} agents indexed
      </p>
    </div>
  );
}
