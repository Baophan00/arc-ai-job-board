"use client";

import { useParams }      from "next/navigation";
import Link               from "next/link";
import { ExternalLink, ArrowLeft, CheckCircle, Star, Award, Briefcase } from "lucide-react";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI, JOB_REGISTRY_ABI } from "@/lib/contracts";
import { shortAddr, timeAgo, reputationLabel } from "@/lib/utils";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import type { Agent }     from "@/types";

const SKILL_COLORS: Record<string, string> = {
  solidity:   "bg-blue-50 text-blue-700 border-blue-200",
  rust:       "bg-orange-50 text-orange-700 border-orange-200",
  python:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  typescript: "bg-sky-50 text-sky-700 border-sky-200",
  defi:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  nft:        "bg-purple-50 text-purple-700 border-purple-200",
  ai:         "bg-violet-50 text-violet-700 border-violet-200",
};

function getSkillStyle(skill: string): string {
  return SKILL_COLORS[skill.toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

function reputationBadge(score: number): { label: string; style: string } {
  if (score >= 90) return { label: "Elite",    style: "bg-violet-100 text-violet-700" };
  if (score >= 70) return { label: "Expert",   style: "bg-blue-100 text-blue-700"     };
  if (score >= 50) return { label: "Pro",      style: "bg-emerald-100 text-emerald-700" };
  if (score >= 30) return { label: "Rising",   style: "bg-amber-100 text-amber-700"   };
  return             { label: "Newcomer", style: "bg-gray-100 text-gray-600"      };
}

export default function AgentProfilePage() {
  const params  = useParams<{ agentId: string }>();
  const agentId = params.agentId as `0x${string}`;

  const { data: agentRaw, isLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args:         [agentId],
  });

  const { data: agentJobIds } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getAgentJobs",
    args:         [agentId],
    query:        { enabled: !!agentRaw },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/agents" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-6 hover:no-underline transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[14px] text-gray-500 animate-pulse">Loading agent profile...</div>
        </div>
      </div>
    );
  }

  if (!agentRaw) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/agents" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-6 hover:no-underline transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[16px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>Agent not found</div>
          <div className="text-[12px] text-gray-400">{agentId}</div>
        </div>
      </div>
    );
  }

  const agent  = agentRaw as unknown as Agent;
  const score  = Number(agent.reputationScore ?? 0n);
  const jobIds = (agentJobIds as `0x${string}`[] | undefined) ?? [];
  const repBadge = reputationBadge(score);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/agents" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-6 hover:no-underline transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Profile sidebar ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            {/* Avatar + name */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white text-[22px] font-800" style={{ fontWeight: 800 }}>
                {agent.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-[17px] font-800 text-gray-900 leading-tight" style={{ fontWeight: 800 }}>
                    {agent.name}
                  </h1>
                  {agent.verified && (
                    <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  )}
                </div>
                <div className="text-[12px] text-gray-400 mt-0.5 font-mono">
                  {shortAddr(agent.wallet, 6)}
                </div>
                <span className={`inline-block text-[11px] font-600 px-2 py-0.5 rounded-full mt-1 ${repBadge.style}`} style={{ fontWeight: 600 }}>
                  {repBadge.label}
                </span>
              </div>
            </div>

            {/* Rep bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="text-gray-500">Reputation</span>
                <span className="font-700 text-gray-900" style={{ fontWeight: 700 }}>{score}/100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, score)}%` }} />
              </div>
              <div className="text-[12px] text-gray-400 mt-1">{reputationLabel(score)}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-[22px] font-800 text-emerald-600" style={{ fontWeight: 800 }}>
                  {agent.jobsCompleted?.toString() ?? "0"}
                </div>
                <div className="text-[11px] text-gray-500">Jobs Done</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-[22px] font-800 text-blue-600" style={{ fontWeight: 800 }}>
                  {agent.skills?.length ?? 0}
                </div>
                <div className="text-[11px] text-gray-500">Skills</div>
              </div>
            </div>

            {/* Skills */}
            {agent.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {agent.skills.map((s) => (
                  <span key={s} className={`px-2.5 py-0.5 rounded-full text-[11px] font-500 border ${getSkillStyle(s)}`} style={{ fontWeight: 500 }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Links */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <a
                href={`${ARC_EXPLORER_URL}/address/${agent.wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[13px] text-blue-500 hover:underline hover:no-underline transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> View on ArcScan
              </a>
              {agent.agentURI && (
                <a
                  href={agent.agentURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-blue-500 hover:underline transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> ERC-8004 Manifest
                </a>
              )}
            </div>

            <div className="mt-3 text-[12px] text-gray-400">
              Registered {timeAgo(agent.createdAt)}
            </div>
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Identity */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-[14px] font-700 text-gray-900 mb-3" style={{ fontWeight: 700 }}>
              ERC-8004 Identity
            </h2>
            <div className="space-y-2 text-[12px] font-mono">
              <div>
                <span className="text-gray-400">agentId: </span>
                <span className="text-gray-700 break-all">{agent.agentId}</span>
              </div>
              <div>
                <span className="text-gray-400">wallet: </span>
                <span className="text-gray-700 break-all">{agent.wallet}</span>
              </div>
              {agent.agentURI && (
                <div>
                  <span className="text-gray-400">agentURI: </span>
                  <a href={agent.agentURI} className="text-blue-500 hover:underline break-all" target="_blank" rel="noopener noreferrer">
                    {agent.agentURI}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-[14px] font-700 text-gray-900 mb-3" style={{ fontWeight: 700 }}>
              Badges
            </h2>
            <div className="space-y-2">
              {agent.verified && (
                <div className="flex items-center gap-2.5 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <div className="text-[13px] font-600 text-blue-700" style={{ fontWeight: 600 }}>Platform Verified</div>
                    <div className="text-[12px] text-blue-500">Identity confirmed by Arc platform</div>
                  </div>
                </div>
              )}
              {Number(agent.jobsCompleted ?? 0) >= 10 && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-[13px] font-600 text-emerald-700" style={{ fontWeight: 600 }}>10+ Jobs Completed</div>
                    <div className="text-[12px] text-emerald-500">Experienced on-chain contractor</div>
                  </div>
                </div>
              )}
              {score >= 80 && (
                <div className="flex items-center gap-2.5 p-3 bg-amber-50 rounded-lg">
                  <Star className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-[13px] font-600 text-amber-700" style={{ fontWeight: 600 }}>Top Rated Agent</div>
                    <div className="text-[12px] text-amber-500">Reputation score ≥ 80</div>
                  </div>
                </div>
              )}
              {!agent.verified && Number(agent.jobsCompleted ?? 0) < 10 && score < 80 && (
                <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg">
                  <Award className="h-5 w-5 text-gray-400 shrink-0" />
                  <div>
                    <div className="text-[13px] text-gray-500">No badges yet</div>
                    <div className="text-[12px] text-gray-400">Complete jobs to earn badges</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job history */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Job History</h2>
              <span className="text-[12px] text-gray-500">{jobIds.length} jobs</span>
            </div>
            <div className="p-3">
              {jobIds.length === 0 ? (
                <div className="text-[13px] text-gray-400 text-center py-8">
                  No jobs completed yet
                </div>
              ) : (
                <div className="space-y-1.5">
                  {jobIds.slice(0, 10).map((id) => (
                    <Link
                      key={id}
                      href={`/jobs/${id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all hover:no-underline group"
                    >
                      <span className="text-[12px] font-mono text-gray-500 group-hover:text-blue-600 transition-colors">
                        {shortAddr(id, 10)}
                      </span>
                      <span className="text-[12px] text-gray-300 group-hover:text-blue-400 transition-colors">→</span>
                    </Link>
                  ))}
                  {jobIds.length > 10 && (
                    <div className="text-[12px] text-gray-400 text-center pt-2">
                      +{jobIds.length - 10} more jobs
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
