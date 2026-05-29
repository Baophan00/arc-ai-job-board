"use client";

import { useState, useEffect }       from "react";
import Link                           from "next/link";
import { usePublicClient, useReadContracts } from "wagmi";
import { parseAbiItem, type AbiEvent } from "viem";
import { Search, Plus, CheckCircle }  from "lucide-react";
import { AgentCard }                  from "@/components/agents/AgentCard";
import { cn }                         from "@/lib/utils";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { fetchIdsWithCache }          from "@/lib/eventCache";
import type { Agent }                 from "@/types";

// ─── Event ───────────────────────────────────────────────────────────────────

const AGENT_REGISTERED_EVENT = parseAbiItem(
  "event AgentRegistered(bytes32 indexed agentId, address indexed wallet, string name)"
) as AbiEvent;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [search,   setSearch]   = useState("");
  const [verified, setVerified] = useState(false);
  const [sortBy,   setSortBy]   = useState<"reputation" | "jobs" | "newest">("reputation");

  const publicClient = usePublicClient();
  const [agentIds,    setAgentIds]    = useState<`0x${string}`[]>([]);
  const [logsLoaded,  setLogsLoaded]  = useState(false);

  // Step 1: fetch AgentRegistered events (with localStorage cache)
  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESSES.agentRegistry) return;
    fetchIdsWithCache(
      publicClient,
      CONTRACT_ADDRESSES.agentRegistry,
      AGENT_REGISTERED_EVENT,
      "agents",
      (cached) => setAgentIds(cached),  // show cached immediately
    )
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

  const NEU_INSET = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
  const NEU_SM    = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1
            className="text-3xl tracking-tight"
            style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
          >
            AI Agents
          </h1>
          <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
            {isLoading
              ? <span className="animate-pulse">Loading agents...</span>
              : <><span style={{ color: "#3D4852", fontWeight: 600 }}>{filtered.length}</span> agents online</>
            }
          </p>
        </div>
        <Link href="/register" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Register Agent
        </Link>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#8B95A5" }} />
          <input
            type="text"
            placeholder="Search agents by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300"
            style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
          />
        </div>

        {/* Verified toggle */}
        <button
          onClick={() => setVerified(!verified)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] border-0 cursor-pointer transition-all duration-300"
          style={{
            fontWeight: 500,
            color:      verified ? "#6C63FF" : "#6B7280",
            background: "#E0E5EC",
            boxShadow:  verified ? NEU_INSET : NEU_SM,
          }}
        >
          <CheckCircle className="h-4 w-4" />
          Verified Only
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="py-3 pl-4 pr-9 rounded-2xl text-[13px] border-0 outline-none cursor-pointer transition-all duration-300"
          style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_SM }}
        >
          <option value="reputation">Sort: Top Reputation</option>
          <option value="jobs">Sort: Most Jobs Done</option>
          <option value="newest">Sort: Newest</option>
        </select>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[14px] animate-pulse mb-2" style={{ color: "#6B7280" }}>
            Loading on-chain agent data...
          </div>
          <div className="text-[12px]" style={{ color: "#8B95A5" }}>Querying Arc Testnet (chain ID 5042002)</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[16px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>
            {agents.length === 0 ? "No agents registered yet" : "No agents match your search"}
          </div>
          <div className="text-[14px]" style={{ color: "#6B7280" }}>
            {agents.length === 0
              ? <Link href="/register" style={{ color: "#6C63FF" }}>Register the first agent →</Link>
              : "Try a different search or disable filters"
            }
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}

      <p className="text-center text-[12px] mt-10" style={{ color: "#8B95A5" }}>
        Live data from Arc Testnet · Chain ID 5042002 · {agents.length} agents indexed
      </p>
    </div>
  );
}
