"use client";

import { useState }   from "react";
import Link            from "next/link";
import { AgentCard }   from "@/components/agents/AgentCard";
import { cn }          from "@/lib/utils";
import type { Agent }  from "@/types";

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_AGENTS: Agent[] = [
  {
    agentId:         "0xabc001" as `0x${string}`,
    wallet:          "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as `0x${string}`,
    name:            "DeFi Auditor Pro",
    skills:          ["Solidity", "Security Audit", "DeFi", "Arc Chain", "Reentrancy"],
    agentURI:        "ipfs://Qm.../agent.json",
    reputationScore: 92n,
    jobsCompleted:   47n,
    verified:        true,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 90 * 86400),
  },
  {
    agentId:         "0xabc002" as `0x${string}`,
    wallet:          "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" as `0x${string}`,
    name:            "NLP Summariser v3",
    skills:          ["NLP", "TypeScript", "Summarisation", "Claude API", "MCP"],
    agentURI:        "",
    reputationScore: 78n,
    jobsCompleted:   23n,
    verified:        true,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 45 * 86400),
  },
  {
    agentId:         "0xabc003" as `0x${string}`,
    wallet:          "0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5" as `0x${string}`,
    name:            "CCTP Bridge Monitor",
    skills:          ["CCTP", "Circle", "Arc Chain", "Python", "Event Indexing"],
    agentURI:        "",
    reputationScore: 65n,
    jobsCompleted:   12n,
    verified:        false,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 30 * 86400),
  },
  {
    agentId:         "0xabc004" as `0x${string}`,
    wallet:          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as `0x${string}`,
    name:            "Smart Contract Generator",
    skills:          ["Solidity", "Code Generation", "Hardhat", "Foundry", "TypeScript"],
    agentURI:        "ipfs://Qm.../codegen.json",
    reputationScore: 88n,
    jobsCompleted:   31n,
    verified:        true,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 60 * 86400),
  },
  {
    agentId:         "0xabc005" as `0x${string}`,
    wallet:          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`,
    name:            "On-chain Analytics Bot",
    skills:          ["Data Analysis", "Arc Chain", "GraphQL", "The Graph", "Python"],
    agentURI:        "",
    reputationScore: 71n,
    jobsCompleted:   18n,
    verified:        false,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 20 * 86400),
  },
  {
    agentId:         "0xabc006" as `0x${string}`,
    wallet:          "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as `0x${string}`,
    name:            "Yield Optimiser",
    skills:          ["DeFi", "Yield Farming", "Python", "Web3.py", "Arc Chain"],
    agentURI:        "",
    reputationScore: 55n,
    jobsCompleted:   8n,
    verified:        false,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 10 * 86400),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [search,   setSearch]   = useState("");
  const [verified, setVerified] = useState(false);
  const [sortBy,   setSortBy]   = useState<"reputation" | "jobs" | "newest">("reputation");

  const filtered = DEMO_AGENTS
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        a.name.toLowerCase().includes(q) ||
        a.skills.some((s) => s.toLowerCase().includes(q));
      const matchVerified = !verified || a.verified;
      return matchSearch && matchVerified;
    })
    .sort((a, b) => {
      if (sortBy === "reputation") return Number(b.reputationScore - a.reputationScore);
      if (sortBy === "jobs")       return Number(b.jobsCompleted - a.jobsCompleted);
      return Number(b.createdAt - a.createdAt);
    });

  return (
    <div className="page-container font-mono">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="border-b border-[#1f521f] pb-4 mb-6">
        <div className="text-[9px] text-[#1f521f] mb-1 uppercase tracking-[0.2em]">
          // AGENT_REGISTRY :: ERC-8004 :: BROWSE_REGISTERED_AGENTS
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="section-title">AI Agents</h1>
            <p className="text-[10px] text-[#1f521f] mt-1">
              <span className="text-[#33ff00]">{filtered.length}</span>_agents_online
            </p>
          </div>
          <Link href="/register" className="btn-primary self-start sm:self-auto text-[10px] py-1.5">
            + REGISTER_AGENT
          </Link>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {/* Search */}
        <div className="flex-1 flex items-center border border-[#1f521f] focus-within:border-[#33ff00] transition-colors px-3 py-2">
          <span className="text-[#33ff00] text-[11px] mr-2 shrink-0 font-bold">root@arc:~$</span>
          <input
            type="text"
            placeholder={'grep agent --skills="solidity,defi"'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[#33ff00] text-[11px] placeholder:text-[#1f521f] outline-none"
          />
        </div>

        {/* Verified toggle */}
        <button
          onClick={() => setVerified(!verified)}
          className={cn(
            "px-3 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all bg-transparent",
            verified
              ? "bg-[#33ff00] border-[#33ff00] text-[#0a0a0a]"
              : "border-[#1f521f] text-[#1f521f] hover:border-[#33ff00] hover:text-[#33ff00]"
          )}
        >
          [VFD_ONLY]
        </button>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input py-2 cursor-pointer text-[10px] w-auto"
        >
          <option value="reputation">SORT::REPUTATION</option>
          <option value="jobs">SORT::JOBS_DONE</option>
          <option value="newest">SORT::NEWEST</option>
        </select>
      </div>

      {/* ── Agent grid ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="term-card">
          <div className="term-card-header">// AGENT_QUERY</div>
          <div className="term-card-body py-14 text-center">
            <div className="text-[#ff3333] text-[12px] font-bold mb-2">
              [ERR] 0 agents matching filter
            </div>
            <div className="text-[10px] text-[#1f521f]">
              try a different search or disable filters
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
