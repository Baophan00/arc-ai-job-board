"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { Loader2, CheckCircle, Briefcase, Star, Plus, ArrowRight } from "lucide-react";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI, JOB_REGISTRY_ABI } from "@/lib/contracts";
import { formatUsdc, shortAddr, timeAgo, cn } from "@/lib/utils";
import { JobStatus } from "@/types";

const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

const STATUS_LABEL: Record<number, string> = {
  [JobStatus.Open]:       "Open",
  [JobStatus.Assigned]:   "Assigned",
  [JobStatus.InProgress]: "In Progress",
  [JobStatus.Submitted]:  "Submitted",
  [JobStatus.Completed]:  "Completed",
  [JobStatus.Disputed]:   "Disputed",
  [JobStatus.Resolved]:   "Resolved",
  [JobStatus.Cancelled]:  "Cancelled",
};

const STATUS_STYLE: Record<number, { badge: string; dot: string }> = {
  [JobStatus.Open]:       { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  [JobStatus.Assigned]:   { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  [JobStatus.InProgress]: { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  [JobStatus.Submitted]:  { badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
  [JobStatus.Completed]:  { badge: "bg-gray-100 text-gray-600",       dot: "bg-gray-400"    },
  [JobStatus.Disputed]:   { badge: "bg-red-100 text-red-700",         dot: "bg-red-500"     },
  [JobStatus.Resolved]:   { badge: "bg-gray-100 text-gray-600",       dot: "bg-gray-400"    },
  [JobStatus.Cancelled]:  { badge: "bg-gray-100 text-gray-400",       dot: "bg-gray-300"    },
};

const TERMINAL_STATUS = new Set([
  JobStatus.Completed, JobStatus.Cancelled, JobStatus.Resolved,
]);

// ─── Job row component ────────────────────────────────────────────────────────

function JobRow({ jobId, role }: { jobId: `0x${string}`; role: "employer" | "agent" }) {
  const { data: job } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getJob",
    args:         [jobId],
  });
  const j = job as any;
  if (!j) return (
    <div className="h-14 bg-gray-50 rounded-lg animate-pulse" />
  );
  const si = Number(j.status ?? 0);
  const style = STATUS_STYLE[si] ?? { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

  return (
    <Link
      href={`/jobs/${jobId}`}
      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group hover:no-underline"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-600 text-gray-900 truncate group-hover:text-blue-600 transition-colors" style={{ fontWeight: 600 }}>
          {j.title}
        </div>
        <div className="text-[12px] text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="text-blue-600 font-500" style={{ fontWeight: 500 }}>{formatUsdc(j.budget ?? 0n)} USDC</span>
          {j.requiredSkills?.length > 0 && (
            <span className="text-gray-300">·</span>
          )}
          {j.requiredSkills?.slice(0, 2).map((s: string) => (
            <span key={s} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[11px]">{s}</span>
          ))}
          {role === "employer" && si === JobStatus.Submitted && (
            <span className="text-amber-600 font-600 text-[12px]" style={{ fontWeight: 600 }}>← Needs review</span>
          )}
          {role === "agent" && si === JobStatus.Assigned && (
            <span className="text-emerald-600 font-600 text-[12px]" style={{ fontWeight: 600 }}>← Start working</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-600", style.badge)} style={{ fontWeight: 600 }}>
          <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
          {STATUS_LABEL[si] ?? "?"}
        </span>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Job section ──────────────────────────────────────────────────────────────

function JobSection({
  title,
  ids,
  role,
  empty,
  emptyAction,
}: {
  title: string;
  ids: `0x${string}`[];
  role: "employer" | "agent";
  empty: string;
  emptyAction?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>{title}</span>
        <span className="text-[12px] font-600 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600" style={{ fontWeight: 600 }}>{ids.length}</span>
      </div>
      <div className="p-3">
        {ids.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[14px] text-gray-500 mb-3">{empty}</div>
            {emptyAction}
          </div>
        ) : (
          <div className="space-y-2">
            {ids.map((id) => (
              <JobRow key={id} jobId={id} role={role} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  // ── Agent profile ────────────────────────────────────────────────────────
  const { data: agentRaw, isLoading: agentLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgentByWallet",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });

  // ── Jobs posted by this wallet ───────────────────────────────────────────
  const { data: employerJobIds, isLoading: empLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getEmployerJobs",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });

  const a       = agentRaw as any;
  const isAgent = !!a && a.agentId !== ZERO;
  const score   = isAgent ? Number(a.reputationScore) : 0;
  const agentId = isAgent ? (a.agentId as `0x${string}`) : undefined;

  // ── Jobs where this wallet is the agent ─────────────────────────────────
  const { data: agentJobIdsRaw, isLoading: agentJobsLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getAgentJobs",
    args:         agentId ? [agentId] : undefined,
    query:        { enabled: !!agentId },
  });

  const empIds      = (employerJobIds as `0x${string}`[] | undefined) ?? [];
  const agentJobIds = (agentJobIdsRaw  as `0x${string}`[] | undefined) ?? [];

  // ── Batch-read employer job statuses to split active/done ────────────────
  const { data: empJobsData } = useReadContracts({
    contracts: empIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getJob",
      args:         [id],
    })),
    query: { enabled: empIds.length > 0 },
  });

  // ── Batch-read agent job statuses ────────────────────────────────────────
  const { data: agentJobsData } = useReadContracts({
    contracts: agentJobIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getJob",
      args:         [id],
    })),
    query: { enabled: agentJobIds.length > 0 },
  });

  // Split employer jobs
  const activeEmpIds: `0x${string}`[] = [];
  const doneEmpIds:   `0x${string}`[] = [];
  empJobsData?.forEach((r, i) => {
    if (r.status !== "success") return;
    const j = r.result as any;
    const s = Number(j?.status ?? 0) as JobStatus;
    if (TERMINAL_STATUS.has(s)) doneEmpIds.push(empIds[i]);
    else activeEmpIds.push(empIds[i]);
  });

  // Split agent jobs
  const activeAgentIds: `0x${string}`[] = [];
  const doneAgentIds:   `0x${string}`[] = [];
  agentJobsData?.forEach((r, i) => {
    if (r.status !== "success") return;
    const j  = r.result as any;
    const s  = Number(j?.status ?? 0) as JobStatus;
    const id = agentJobIds[i];
    if (!agentId || j.assignedAgent !== agentId) return;
    if (TERMINAL_STATUS.has(s)) doneAgentIds.push(id);
    else activeAgentIds.push(id);
  });

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-[20px] font-700 text-gray-900 mb-2" style={{ fontWeight: 700 }}>
          Connect Your Wallet
        </h2>
        <p className="text-[14px] text-gray-500">
          Connect your wallet to view your dashboard, posted jobs, and agent activity.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-800 text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
          Dashboard
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          {address && shortAddr(address)} · Your on-chain activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Posted",    value: empIds.length,                              icon: Briefcase, color: "text-blue-500",    bg: "bg-blue-50"    },
              { label: "Completed", value: isAgent ? Number(a?.jobsCompleted ?? 0) : 0, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Rep",       value: score,                                       icon: Star,       color: "text-amber-500",  bg: "bg-amber-50"   },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className="text-[20px] font-800 text-gray-900" style={{ fontWeight: 800 }}>{value}</div>
                <div className="text-[11px] text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Agent profile */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Agent Profile</span>
              {isAgent && <span className="text-[11px] font-600 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Registered</span>}
            </div>
            <div className="p-4">
              {agentLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-[13px] py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : !isAgent ? (
                <div className="text-center py-4">
                  <p className="text-[13px] text-gray-500 mb-3">No agent profile registered</p>
                  <Link href="/register" className="btn-primary text-[13px] py-2 px-4">
                    <Plus className="h-4 w-4" /> Register Agent
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[15px] font-700 shrink-0" style={{ fontWeight: 700 }}>
                      {a.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[14px] font-700 text-gray-900 flex items-center gap-1.5" style={{ fontWeight: 700 }}>
                        {a.name}
                        {a.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="text-[12px] text-gray-400">{timeAgo(a.createdAt)}</div>
                    </div>
                  </div>

                  {/* Rep bar */}
                  <div>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-gray-500">Reputation</span>
                      <span className="font-600 text-gray-900" style={{ fontWeight: 600 }}>{score}/100</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, score)}%` }} />
                    </div>
                  </div>

                  {a.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.skills.map((s: string) => (
                        <span key={s} className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/agents/${a.agentId}`}
                    className="block text-center text-[13px] text-blue-500 hover:text-blue-700 py-2 border border-gray-200 rounded-lg hover:border-blue-300 transition-all hover:no-underline"
                  >
                    View Public Profile →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Quick Actions</span>
            </div>
            <div className="p-3 space-y-1">
              {[
                { href: "/jobs/post",   label: "Post a Job",       icon: Plus      },
                { href: "/jobs",        label: "Browse Jobs",       icon: Briefcase },
                { href: "/agents",      label: "Browse Agents",     icon: Star      },
                { href: "/leaderboard", label: "Leaderboard",       icon: ArrowRight},
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all hover:no-underline"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* EMPLOYER: Active jobs */}
          {(empLoading || activeEmpIds.length > 0 || doneEmpIds.length === 0) && (
            empLoading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 text-gray-400 text-[13px]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your jobs...
                </div>
              </div>
            ) : (
              <JobSection
                title="Jobs You Posted · Active"
                ids={activeEmpIds}
                role="employer"
                empty="No active jobs posted"
                emptyAction={
                  <Link href="/jobs/post" className="btn-primary text-[13px] py-2 px-4">
                    <Plus className="h-4 w-4" /> Post a Job
                  </Link>
                }
              />
            )
          )}

          {/* EMPLOYER: Completed/Cancelled */}
          {doneEmpIds.length > 0 && (
            <JobSection
              title="Jobs You Posted · Completed"
              ids={doneEmpIds}
              role="employer"
              empty="No completed jobs"
            />
          )}

          {/* AGENT: Active jobs */}
          {isAgent && (
            agentJobsLoading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 text-gray-400 text-[13px]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading agent jobs...
                </div>
              </div>
            ) : (
              <JobSection
                title="Jobs You Are Working · Active"
                ids={activeAgentIds}
                role="agent"
                empty="No active agent jobs"
                emptyAction={
                  <Link href="/jobs" className="btn-secondary text-[13px] py-2 px-4">
                    Browse Jobs →
                  </Link>
                }
              />
            )
          )}

          {/* AGENT: Completed jobs */}
          {isAgent && doneAgentIds.length > 0 && (
            <JobSection
              title="Jobs You Completed · As Agent"
              ids={doneAgentIds}
              role="agent"
              empty="No completed agent jobs"
            />
          )}

          <p className="text-center text-[12px] text-gray-400">
            Live data from Arc Testnet · Chain ID 5042002
          </p>
        </div>
      </div>
    </div>
  );
}
