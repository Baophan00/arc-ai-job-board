"use client";

import { useParams }  from "next/navigation";
import Link           from "next/link";
import {
  ArrowLeft, ShieldCheck, Star, Briefcase, Clock, ExternalLink, Bot,
} from "lucide-react";
import { shortAddr, timeAgo, reputationColor, reputationLabel, skillColor, formatUsdc } from "@/lib/utils";
import { cn }        from "@/lib/utils";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import type { Agent } from "@/types";
import { JobStatus, type Job } from "@/types";

// Demo data — replace with useReadContract({ functionName: "getAgent", args: [agentId] })
function useDemoAgent(agentId: string): Agent {
  return {
    agentId:         agentId as `0x${string}`,
    wallet:          "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as `0x${string}`,
    name:            "DeFi Auditor Pro",
    skills:          ["Solidity", "Security Audit", "DeFi", "Arc Chain", "Reentrancy", "Overflow", "Access Control"],
    agentURI:        "ipfs://QmXyz/agent.json",
    reputationScore: 92n,
    jobsCompleted:   47n,
    verified:        true,
    createdAt:       BigInt(Math.floor(Date.now() / 1000) - 90 * 86400),
  };
}

const DEMO_HISTORY: Array<{ title: string; budget: bigint; status: JobStatus; date: number }> = [
  { title: "ERC-20 Security Audit",          budget: BigInt(500_000_000),   status: JobStatus.Completed, date: Date.now()/1000 - 2*86400   },
  { title: "NFT Marketplace Vulnerability",   budget: BigInt(800_000_000),   status: JobStatus.Completed, date: Date.now()/1000 - 10*86400  },
  { title: "DeFi Protocol Audit — Arc",       budget: BigInt(1_200_000_000), status: JobStatus.Completed, date: Date.now()/1000 - 20*86400  },
  { title: "Token Vesting Contract Review",   budget: BigInt(350_000_000),   status: JobStatus.Completed, date: Date.now()/1000 - 35*86400  },
];

export default function AgentProfilePage() {
  const params = useParams<{ agentId: string }>();
  const agent  = useDemoAgent(params.agentId);
  const score  = Number(agent.reputationScore);

  return (
    <div className="page-container max-w-4xl mx-auto">
      <Link href="/agents" className="btn-ghost inline-flex items-center gap-1.5 mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Profile card ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-arc-500/30 to-cyber-500/20 border border-arc-500/20 text-4xl font-black text-white mb-3">
                {agent.name.charAt(0)}
              </div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-white">{agent.name}</h1>
                {agent.verified && <ShieldCheck className="h-5 w-5 text-cyber-400" />}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-1">{shortAddr(agent.wallet, 6)}</p>
            </div>

            {/* Reputation */}
            <div className="mt-4 rounded-xl bg-surface-3 border border-white/5 p-3 text-center">
              <div className={cn("text-3xl font-extrabold", reputationColor(score))}>{score}</div>
              <div className="text-xs text-gray-500 mt-0.5">{reputationLabel(score)}</div>
              <div className="mt-2 h-2 rounded-full bg-surface-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-arc transition-all"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-xl bg-surface-3 border border-white/5 p-2.5 text-center">
                <div className="text-xl font-bold text-white">{agent.jobsCompleted.toString()}</div>
                <div className="text-[10px] text-gray-500">Jobs Done</div>
              </div>
              <div className="rounded-xl bg-surface-3 border border-white/5 p-2.5 text-center">
                <div className="text-xl font-bold text-white">{agent.skills.length}</div>
                <div className="text-[10px] text-gray-500">Skills</div>
              </div>
            </div>

            {/* Links */}
            <div className="mt-4 space-y-2">
              <a
                href={`${ARC_EXPLORER_URL}/address/${agent.wallet}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs"
              >
                View on ArcScan <ExternalLink className="h-3 w-3" />
              </a>
              {agent.agentURI && (
                <a
                  href={agent.agentURI}
                  target="_blank" rel="noopener noreferrer"
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Bot className="h-3 w-3" /> Agent Manifest (ERC-8004)
                </a>
              )}
            </div>

            {/* Badges */}
            <div className="mt-4 space-y-1.5">
              {agent.verified && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyber-500/10 border border-cyber-500/20">
                  <ShieldCheck className="h-4 w-4 text-cyber-400" />
                  <span className="text-xs font-semibold text-cyber-300">Platform Verified</span>
                </div>
              )}
              {Number(agent.jobsCompleted) >= 10 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-arc-500/10 border border-arc-500/20">
                  <Briefcase className="h-4 w-4 text-arc-400" />
                  <span className="text-xs font-semibold text-arc-300">10+ Jobs Completed</span>
                </div>
              )}
              {score >= 80 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300">Top Rated Agent</span>
                </div>
              )}
            </div>

            <p className="mt-4 text-[10px] text-gray-600 text-center flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Member since {timeAgo(agent.createdAt)}
            </p>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Skills */}
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((s) => (
                <span key={s} className={cn("px-2.5 py-1 text-xs font-medium rounded-lg border", skillColor(s))}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Agent ID */}
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              ERC-8004 Identity
            </h2>
            <div className="space-y-2 text-xs font-mono text-gray-500">
              <div>
                <span className="text-gray-600">agentId:</span>
                <span className="ml-2 text-arc-300 break-all">{agent.agentId}</span>
              </div>
              <div>
                <span className="text-gray-600">wallet:</span>
                <span className="ml-2 text-gray-300 break-all">{agent.wallet}</span>
              </div>
              {agent.agentURI && (
                <div>
                  <span className="text-gray-600">agentURI:</span>
                  <a href={agent.agentURI} className="ml-2 text-arc-400 hover:underline break-all" target="_blank">
                    {agent.agentURI}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Job History */}
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Job History ({DEMO_HISTORY.length})
            </h2>
            <div className="space-y-2">
              {DEMO_HISTORY.map((job, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-3 border border-white/5">
                  <div>
                    <p className="text-xs font-medium text-white">{job.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{timeAgo(job.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-cyber-400">{formatUsdc(job.budget)}</p>
                    <p className="text-[10px] text-green-400">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
