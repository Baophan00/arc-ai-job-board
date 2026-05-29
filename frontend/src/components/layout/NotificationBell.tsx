"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { shortAddr } from "@/lib/utils";
import { JobStatus } from "@/types";

type NotifType =
  | "approval_needed"
  | "assigned"
  | "completed"
  | "applicants"
  | "started"
  | "revision"
  | "disputed"
  | "resolved"
  | "cancelled";

interface Notif {
  id:   string;
  type: NotifType;
  label: string;
  sub:   string;
  href:  string;
  /** Unix timestamp (job.createdAt) — used for newest-first sorting */
  ts:   number;
}

// ── localStorage helpers for dismissed notification IDs ────────────────────
const STORAGE_KEY = "agentcywork:dismissed_notifs:v1";

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveDismissed(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch { /* storage full / SSR */ }
}

const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

const DOT_COLOR: Record<NotifType, string> = {
  applicants:      "#6C63FF",
  assigned:        "#6C63FF",
  started:         "#38B2AC",
  revision:        "#F59E0B",
  approval_needed: "#F59E0B",
  completed:       "#38B2AC",
  disputed:        "#EF4444",
  resolved:        "#8B5CF6",
  cancelled:       "#6B7280",
};

export function NotificationBell() {
  const { address } = useAccount();
  const [open,      setOpen]      = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Load dismissed IDs from localStorage on mount
  useEffect(() => { setDismissed(loadDismissed()); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(next);
  };

  const dismissAll = (ids: string[]) => {
    const next = new Set(dismissed);
    ids.forEach(id => next.add(id));
    setDismissed(next);
    saveDismissed(next);
  };

  const { data: empIds } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getEmployerJobs",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, refetchInterval: 20_000 },
  });

  const { data: agentRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgentByWallet",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  const agent    = agentRaw as any;
  const hasAgent = !!agent && agent.agentId !== ZERO;
  const agentId  = hasAgent ? (agent.agentId as `0x${string}`) : undefined;

  const { data: agentJobIdsRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getAgentJobs",
    args:         agentId ? [agentId] : undefined,
    query:        { enabled: !!agentId, refetchInterval: 20_000 },
  });

  const employerJobIds = (empIds as `0x${string}`[] | undefined) ?? [];
  const agentJobIds    = (agentJobIdsRaw as `0x${string}`[] | undefined) ?? [];
  const allIds         = [...new Set([...employerJobIds, ...agentJobIds])];

  const { data: jobsData } = useReadContracts({
    contracts: allIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getJob",
      args:         [id],
    })),
    query: { enabled: allIds.length > 0, refetchInterval: 20_000 },
  });

  const openEmpIds = allIds.filter((id, i) => {
    const r = jobsData?.[i];
    if (!r || r.status !== "success") return false;
    const j = r.result as any;
    return employerJobIds.includes(id) && Number(j?.status ?? -1) === JobStatus.Open;
  });

  const { data: applicantsData } = useReadContracts({
    contracts: openEmpIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getApplications",
      args:         [id],
    })),
    query: { enabled: openEmpIds.length > 0, refetchInterval: 20_000 },
  });

  const allNotifs: Notif[] = [];

  if (jobsData) {
    jobsData.forEach((r, i) => {
      if (r.status !== "success" || !r.result) return;
      const job    = r.result as any;
      const id     = allIds[i];
      const status = Number(job.status ?? 0);
      const title  = job.title ? job.title : shortAddr(id, 6);
      const ts     = Number(job.createdAt ?? 0);
      const isEmp  = employerJobIds.includes(id);
      const isAgt  = agentJobIds.includes(id);
      const isMyAgent = agentId && job.assignedAgent === agentId;

      // ── Employer notifications ───────────────────────────────────────────
      if (isEmp && status === JobStatus.InProgress && !job.deliverableURI) {
        allNotifs.push({ id: `started-${id}`, type: "started", label: "Agent started working", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isEmp && status === JobStatus.Submitted) {
        allNotifs.push({ id: `submitted-${id}`, type: "approval_needed", label: "Review deliverable", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isEmp && status === JobStatus.Disputed) {
        allNotifs.push({ id: `disputed-emp-${id}`, type: "disputed", label: "Job is under dispute", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isEmp && status === JobStatus.Resolved) {
        allNotifs.push({ id: `resolved-emp-${id}`, type: "resolved", label: "Dispute resolved", sub: title, href: `/jobs/${id}`, ts });
      }

      // ── Agent notifications ──────────────────────────────────────────────
      if (isAgt && !isEmp && status === JobStatus.Assigned && isMyAgent) {
        allNotifs.push({ id: `assigned-${id}`, type: "assigned", label: "You were assigned to a job", sub: title, href: `/jobs/${id}`, ts });
      }
      // Revision: InProgress + has deliverable = employer sent work back
      if (isAgt && !isEmp && status === JobStatus.InProgress && isMyAgent && job.deliverableURI) {
        allNotifs.push({ id: `revision-${id}`, type: "revision", label: "Revision requested — open to read message", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isAgt && status === JobStatus.Completed && isMyAgent) {
        allNotifs.push({ id: `paid-${id}`, type: "completed", label: "Payment released 🎉", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isAgt && status === JobStatus.Disputed && isMyAgent) {
        allNotifs.push({ id: `disputed-agt-${id}`, type: "disputed", label: "Job is under dispute", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isAgt && status === JobStatus.Resolved && isMyAgent) {
        allNotifs.push({ id: `resolved-agt-${id}`, type: "resolved", label: "Dispute resolved — check outcome", sub: title, href: `/jobs/${id}`, ts });
      }
      if (isAgt && status === JobStatus.Cancelled && isMyAgent) {
        allNotifs.push({ id: `cancelled-${id}`, type: "cancelled", label: "Job was cancelled", sub: title, href: `/jobs/${id}`, ts });
      }
    });
  }

  if (applicantsData) {
    applicantsData.forEach((r, i) => {
      if (r.status !== "success" || !r.result) return;
      const ids = r.result as unknown as `0x${string}`[];
      if (ids.length === 0) return;
      const jobId = openEmpIds[i];
      const jobIdx = allIds.indexOf(jobId);
      const jobR   = jobsData?.[jobIdx];
      const title  = (jobR?.status === "success" && (jobR.result as any)?.title)
        ? (jobR.result as any).title : shortAddr(jobId, 6);
      const ts     = jobR?.status === "success" ? Number((jobR.result as any)?.createdAt ?? 0) : 0;
      // Include count in ID → re-triggers when new applicant arrives after dismissal
      allNotifs.push({ id: `applicants-${jobId}-${ids.length}`, type: "applicants", label: `${ids.length} applicant${ids.length > 1 ? "s" : ""} waiting`, sub: title, href: `/jobs/${jobId}`, ts });
    });
  }

  // Sort: newest first (highest createdAt first)
  allNotifs.sort((a, b) => b.ts - a.ts);

  // Hide dismissed notifications — clicking a notification OR pressing X both dismiss it
  const notifs = allNotifs.filter(n => !dismissed.has(n.id));

  if (!address) return null;

  const count = notifs.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-2xl transition-all duration-300 cursor-pointer border-0"
        style={{
          background: "#E0E5EC",
          color: open ? "#6C63FF" : "#6B7280",
          boxShadow: open
            ? "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)"
            : "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)",
        }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
            style={{ background: "#6C63FF", fontWeight: 700 }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-80 rounded-[24px] z-50 overflow-hidden animate-slide-up"
          style={{
            background: "#E0E5EC",
            boxShadow: "12px 12px 24px rgb(163,177,198,0.7), -12px -12px 24px rgba(255,255,255,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(163,177,198,0.3)" }}
          >
            <span className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button
                  onClick={() => dismissAll(notifs.map(n => n.id))}
                  className="text-[11px] cursor-pointer border-0 bg-transparent transition-colors"
                  style={{ color: "#8B95A5" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
                >
                  Mark all read
                </button>
              )}
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full"
                style={{
                  fontWeight: 600,
                  background: "#E0E5EC",
                  color: count > 0 ? "#6C63FF" : "#6B7280",
                  boxShadow: count > 0
                    ? "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)"
                    : "3px 3px 6px rgb(163,177,198,0.5), -3px -3px 6px rgba(255,255,255,0.4)",
                }}
              >
                {count}
              </span>
            </div>
          </div>

          {/* List */}
          {count === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[13px]" style={{ color: "#6B7280" }}>No new notifications</div>
              <div className="text-[12px] mt-1" style={{ color: "#8B95A5" }}>You&apos;re all caught up ✓</div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-5 py-3.5 group"
                  style={{ borderBottom: "1px solid rgba(163,177,198,0.2)" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: DOT_COLOR[n.type] }}
                  />
                  <Link
                    href={n.href}
                    onClick={() => { dismiss(n.id); setOpen(false); }}
                    className="flex-1 min-w-0 hover:no-underline"
                  >
                    <div
                      className="text-[13px] leading-snug transition-colors"
                      style={{ fontWeight: 500, color: "#3D4852" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                    >
                      {n.label}
                    </div>
                    <div className="text-[12px] truncate mt-0.5" style={{ color: "#6B7280" }}>{n.sub}</div>
                  </Link>
                  {/* X button — dismiss without navigating, shown for all notifications */}
                  <button
                    onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                    className="shrink-0 mt-0.5 cursor-pointer border-0 bg-transparent p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#8B95A5" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            className="px-5 py-3"
            style={{ borderTop: "1px solid rgba(163,177,198,0.3)" }}
          >
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-[13px] font-medium hover:no-underline transition-colors"
              style={{ color: "#6C63FF", fontWeight: 500 }}
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
