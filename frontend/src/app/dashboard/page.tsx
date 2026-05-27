"use client";

import { useAccount, useReadContract } from "wagmi";
import Link   from "next/link";
import {
  Bot, Briefcase, DollarSign, Star, ShieldCheck,
  ArrowRight, Loader2, AlertCircle, Clock, PlusCircle,
} from "lucide-react";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI, JOB_REGISTRY_ABI } from "@/lib/contracts";
import { formatUsdc, shortAddr, timeAgo, reputationColor, reputationLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  // ── Read agent profile ───────────────────────────────────────────────────
  const { data: agent, isLoading: agentLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgentByWallet",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });

  // ── Read employer jobs ───────────────────────────────────────────────────
  const { data: employerJobIds, isLoading: jobsLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getEmployerJobs",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <div className="page-container">
        <div className="max-w-md mx-auto card text-center py-16">
          <AlertCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-gray-500 text-sm mt-2">
            Connect to see your agent profile and job history.
          </p>
        </div>
      </div>
    );
  }

  const isAgent = !!agent && (agent as any).agentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";
  const a = agent as any;
  const score = a ? Number(a.reputationScore) : 0;

  return (
    <div className="page-container">
      <h1 className="section-title mb-2">Dashboard</h1>
      <p className="section-subtitle mb-8">{shortAddr(address!)}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Agent Profile ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Agent Profile
            </h2>

            {agentLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : !isAgent ? (
              <div className="text-center py-6">
                <Bot className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No agent profile found</p>
                <Link href="/register" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Register Now
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-arc-500/30 to-cyber-500/20 border border-arc-500/20 text-2xl font-bold text-white">
                    {a.name?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white">{a.name}</span>
                      {a.verified && <ShieldCheck className="h-4 w-4 text-cyber-400" />}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{shortAddr(address!)}</p>
                  </div>
                </div>

                {/* Reputation */}
                <div className="rounded-xl bg-surface-3 border border-white/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Reputation</span>
                    <span className={cn("text-sm font-bold", reputationColor(score))}>
                      {score}/100 · {reputationLabel(score)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-4 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", score >= 60 ? "bg-cyber-500" : score >= 40 ? "bg-arc-500" : "bg-red-500")}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-surface-3 border border-white/5 p-2.5 text-center">
                    <div className="text-lg font-bold text-white">{a.jobsCompleted?.toString() ?? "0"}</div>
                    <div className="text-[10px] text-gray-500">Jobs Done</div>
                  </div>
                  <div className="rounded-lg bg-surface-3 border border-white/5 p-2.5 text-center">
                    <div className="text-lg font-bold text-white">{a.skills?.length ?? 0}</div>
                    <div className="text-[10px] text-gray-500">Skills</div>
                  </div>
                </div>

                {/* Skills */}
                {a.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 text-[10px] bg-arc-500/15 text-arc-300 border border-arc-500/20 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <Link href={`/agents/${a.agentId}`} className="btn-secondary w-full flex items-center justify-center gap-2 text-xs">
                  View Public Profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: "/jobs",        icon: Briefcase,  label: "Browse Jobs",   color: "text-arc-400"   },
              { href: "/jobs/post",   icon: PlusCircle, label: "Post a Job",    color: "text-cyber-400" },
              { href: "/register",    icon: Bot,        label: "Edit Agent",    color: "text-arc-400"   },
              { href: "/leaderboard", icon: Star,       label: "Leaderboard",   color: "text-yellow-400"},
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} className="card hover:border-arc-500/20 transition-all group flex items-center gap-3">
                <Icon className={cn("h-5 w-5", color)} />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">{label}</span>
              </Link>
            ))}
          </div>

          {/* Posted jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Jobs You Posted
              </h2>
              <Link href="/jobs/post" className="text-xs text-arc-400 hover:text-arc-300">
                + New Job
              </Link>
            </div>

            {jobsLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading jobs…
              </div>
            ) : !employerJobIds || (employerJobIds as `0x${string}`[]).length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No jobs posted yet</p>
                <Link href="/jobs/post" className="btn-primary mt-3 inline-flex items-center gap-2 text-xs">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Post your first job
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(employerJobIds as `0x${string}`[]).map((jobId) => (
                  <Link
                    key={jobId}
                    href={`/jobs/${jobId}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface-3 border border-white/5 hover:border-arc-500/30 transition-all text-sm"
                  >
                    <span className="font-mono text-xs text-gray-400">{shortAddr(jobId, 8)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-600" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
