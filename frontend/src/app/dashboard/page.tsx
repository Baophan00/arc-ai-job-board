"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { Loader2, CheckCircle, Briefcase, Star, Plus, ArrowRight } from "lucide-react";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI, JOB_REGISTRY_ABI } from "@/lib/contracts";
import { formatUsdc, shortAddr, timeAgo } from "@/lib/utils";
import { JobStatus } from "@/types";

const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

const NEU           = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const NEU_SM        = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const NEU_INSET     = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
const NEU_INSET_SM  = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

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

const STATUS_DOT: Record<number, string> = {
  [JobStatus.Open]:       "#38B2AC",
  [JobStatus.Assigned]:   "#F59E0B",
  [JobStatus.InProgress]: "#F59E0B",
  [JobStatus.Submitted]:  "#6C63FF",
  [JobStatus.Completed]:  "#6B7280",
  [JobStatus.Disputed]:   "#EF4444",
  [JobStatus.Resolved]:   "#6B7280",
  [JobStatus.Cancelled]:  "#8B95A5",
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
    <div className="h-14 rounded-2xl animate-pulse" style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }} />
  );
  const si   = Number(j.status ?? 0);
  const dot  = STATUS_DOT[si] ?? "#8B95A5";
  const lbl  = STATUS_LABEL[si] ?? "?";

  return (
    <Link
      href={`/jobs/${jobId}`}
      className="flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 hover:no-underline group"
      style={{ background: "#E0E5EC", boxShadow: NEU_SM }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_SM}
    >
      <div className="min-w-0 flex-1">
        <div
          className="text-[14px] truncate transition-colors"
          style={{ fontWeight: 600, color: "#3D4852" }}
        >
          {j.title}
        </div>
        <div className="text-[12px] mt-0.5 flex items-center gap-2 flex-wrap">
          <span style={{ color: "#6C63FF", fontWeight: 500 }}>{formatUsdc(j.budget ?? 0n)} USDC</span>
          {j.requiredSkills?.slice(0, 2).map((s: string) => (
            <span
              key={s}
              className="px-2 py-0.5 rounded-full text-[11px]"
              style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM, color: "#6B7280" }}
            >
              {s}
            </span>
          ))}
          {role === "employer" && si === JobStatus.Submitted && (
            <span className="text-[12px]" style={{ color: "#F59E0B", fontWeight: 600 }}>← Needs review</span>
          )}
          {role === "agent" && si === JobStatus.Assigned && (
            <span className="text-[12px]" style={{ color: "#38B2AC", fontWeight: 600 }}>← Start working</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0 ml-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]"
          style={{ fontWeight: 600, color: dot, background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
          {lbl}
        </span>
        <ArrowRight className="h-4 w-4 transition-colors" style={{ color: "#8B95A5" }} />
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
    <div className="rounded-[32px] overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU }}>
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(163,177,198,0.35)" }}
      >
        <span
          className="text-[13px]"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
        >
          {title}
        </span>
        <span
          className="text-[12px] px-2.5 py-0.5 rounded-full"
          style={{ fontWeight: 600, color: "#6C63FF", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
        >
          {ids.length}
        </span>
      </div>
      <div className="p-4">
        {ids.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-[14px] mb-3" style={{ color: "#6B7280" }}>{empty}</div>
            {emptyAction}
          </div>
        ) : (
          <div className="space-y-2.5">
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
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ background: "#E0E5EC" }}>
        <div
          className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-6"
          style={{ background: "#E0E5EC", boxShadow: NEU }}
        >
          <Briefcase className="h-8 w-8" style={{ color: "#6C63FF" }} />
        </div>
        <h2
          className="text-[22px] mb-3"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Connect Your Wallet
        </h2>
        <p className="text-[14px]" style={{ color: "#6B7280" }}>
          Connect your wallet to view your dashboard, posted jobs, and agent activity.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Dashboard
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
          {address && shortAddr(address)} · Your on-chain activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Posted",    value: empIds.length,                              icon: Briefcase, color: "#6C63FF"  },
              { label: "Completed", value: isAgent ? Number(a?.jobsCompleted ?? 0) : 0, icon: CheckCircle, color: "#38B2AC" },
              { label: "Rep",       value: score,                                       icon: Star,       color: "#F59E0B" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="p-4 rounded-[24px] text-center"
                style={{ background: "#E0E5EC", boxShadow: NEU }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div
                  className="text-[22px]"
                  style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#6C63FF" }}
                >
                  {value}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Agent profile card */}
          <div className="rounded-[32px] overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(163,177,198,0.35)" }}
            >
              <span
                className="text-[13px]"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                Agent Profile
              </span>
              {isAgent && (
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded-full"
                  style={{ fontWeight: 600, color: "#38B2AC", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  Registered
                </span>
              )}
            </div>
            <div className="p-5">
              {agentLoading ? (
                <div className="flex items-center gap-2 py-4" style={{ color: "#8B95A5" }}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[13px]">Loading...</span>
                </div>
              ) : !isAgent ? (
                <div className="text-center py-4">
                  <p className="text-[13px] mb-4" style={{ color: "#6B7280" }}>No agent profile registered</p>
                  <Link href="/register" className="btn-primary text-[13px] py-2 px-4">
                    <Plus className="h-4 w-4" /> Register Agent
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[16px] shrink-0"
                      style={{ fontWeight: 800, background: "#6C63FF", boxShadow: NEU_SM }}
                    >
                      {a.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5" style={{ fontWeight: 700, color: "#3D4852" }}>
                        <span className="text-[14px]">{a.name}</span>
                        {a.verified && <CheckCircle className="h-4 w-4" style={{ color: "#38B2AC" }} />}
                      </div>
                      <div className="text-[12px]" style={{ color: "#8B95A5" }}>{timeAgo(a.createdAt)}</div>
                    </div>
                  </div>

                  {/* Rep bar */}
                  <div>
                    <div className="flex justify-between text-[12px] mb-2">
                      <span style={{ color: "#6B7280" }}>Reputation</span>
                      <span style={{ fontWeight: 600, color: "#6C63FF" }}>{score}/100</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: "#6C63FF" }} />
                    </div>
                  </div>

                  {a.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.skills.map((s: string) => (
                        <span
                          key={s}
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ color: "#6B7280", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/agents/${a.agentId}`}
                    className="block text-center text-[13px] py-2.5 rounded-2xl transition-all duration-300 hover:no-underline"
                    style={{ color: "#6C63FF", fontWeight: 500, background: "#E0E5EC", boxShadow: NEU_SM }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_SM}
                  >
                    View Public Profile →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-[32px] overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div
              className="px-5 py-4"
              style={{ borderBottom: "1px solid rgba(163,177,198,0.35)" }}
            >
              <span
                className="text-[13px]"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                Quick Actions
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { href: "/jobs/post",   label: "Post a Job",     icon: Plus       },
                { href: "/jobs",        label: "Browse Jobs",    icon: Briefcase  },
                { href: "/agents",      label: "Browse Agents",  icon: Star       },
                { href: "/leaderboard", label: "Leaderboard",    icon: ArrowRight },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] rounded-2xl transition-all duration-200 hover:no-underline"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = "#3D4852";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.3)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = "#6B7280";
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#8B95A5" }} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* EMPLOYER: Active jobs */}
          {(empLoading || activeEmpIds.length > 0 || doneEmpIds.length === 0) && (
            empLoading ? (
              <div className="rounded-[32px] p-6" style={{ background: "#E0E5EC", boxShadow: NEU }}>
                <div className="flex items-center gap-2 text-[13px]" style={{ color: "#8B95A5" }}>
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
              <div className="rounded-[32px] p-6" style={{ background: "#E0E5EC", boxShadow: NEU }}>
                <div className="flex items-center gap-2 text-[13px]" style={{ color: "#8B95A5" }}>
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

          <p className="text-center text-[12px] mt-4" style={{ color: "#8B95A5" }}>
            Live data from Arc Testnet · Chain ID 5042002
          </p>
        </div>
      </div>
    </div>
  );
}
