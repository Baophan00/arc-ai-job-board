"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { shortAddr } from "@/lib/utils";
import { JobStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | "approval_needed" | "assigned" | "completed" | "applicants"
  | "started" | "revision" | "disputed" | "resolved" | "cancelled";

interface Notif {
  id:    string;
  type:  NotifType;
  label: string;
  sub:   string;
  href:  string;
}

interface StoredNotif extends Notif {
  read:    boolean; // user has seen it — stays in list, no longer counted in badge
  addedAt: number;  // Date.now() when first recorded
}

// ─── localStorage helpers (per-wallet) ────────────────────────────────────────

const NOTIFS_KEY  = (a: string) => `agentcywork:notifs:v3:${a.toLowerCase()}`;
const CLEARED_KEY = (a: string) => `agentcywork:cleared:v3:${a.toLowerCase()}`;

function loadNotifs(addr: string): StoredNotif[] {
  try { return JSON.parse(localStorage.getItem(NOTIFS_KEY(addr)) ?? "[]"); }
  catch { return []; }
}
function saveNotifs(addr: string, v: StoredNotif[]) {
  try { localStorage.setItem(NOTIFS_KEY(addr), JSON.stringify(v)); } catch {}
}
function loadCleared(addr: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(CLEARED_KEY(addr)) ?? "[]") as string[]); }
  catch { return new Set(); }
}
function saveCleared(addr: string, v: Set<string>) {
  try { localStorage.setItem(CLEARED_KEY(addr), JSON.stringify([...v])); } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// Short suffix from a URI — makes notification IDs unique per submission round
const suf = (s?: string) => (s && s.length > 6 ? s.slice(-6) : s ?? "x");

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { address } = useAccount();
  const [open,    setOpen]    = useState(false);
  const [stored,  setStored]  = useState<StoredNotif[]>([]);
  const [cleared, setCleared] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Load from localStorage whenever wallet changes
  useEffect(() => {
    if (!address) { setStored([]); setCleared(new Set()); return; }
    setStored(loadNotifs(address));
    setCleared(loadCleared(address));
  }, [address]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Chain reads ──────────────────────────────────────────────────────────────

  const { data: empIds } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getEmployerJobs",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, refetchInterval: 15_000 },
  });

  const { data: agentRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgentByWallet",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, refetchInterval: 30_000 },
  });
  const agent    = agentRaw as any;
  const hasAgent = !!agent && agent.agentId !== ZERO;
  const agentId  = hasAgent ? (agent.agentId as `0x${string}`) : undefined;

  const { data: agentJobIdsRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getAgentJobs",
    args:         agentId ? [agentId] : undefined,
    query:        { enabled: !!agentId, refetchInterval: 15_000 },
  });

  const employerJobIds = (empIds as `0x${string}`[] | undefined) ?? [];
  const agentJobIds    = (agentJobIdsRaw as `0x${string}`[] | undefined) ?? [];
  const allIds         = [...new Set([...employerJobIds, ...agentJobIds])];

  const { data: jobsData } = useReadContracts({
    contracts: allIds.map(id => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getJob",
      args:         [id],
    })),
    query: { enabled: allIds.length > 0, refetchInterval: 15_000 },
  });

  const openEmpIds = allIds.filter((id, i) => {
    const r = jobsData?.[i];
    if (!r || r.status !== "success") return false;
    const j = r.result as any;
    return employerJobIds.includes(id) && Number(j?.status ?? -1) === JobStatus.Open;
  });

  const { data: applicantsData } = useReadContracts({
    contracts: openEmpIds.map(id => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getApplications",
      args:         [id],
    })),
    query: { enabled: openEmpIds.length > 0, refetchInterval: 15_000 },
  });

  // ── Build fresh notifications from chain data, merge into localStorage ────────
  // New IDs are added once and NEVER removed automatically — only user can clear them.
  // This ensures notifications are never "missed" due to state transitions.

  useEffect(() => {
    if (!address) return;
    const fresh: Notif[] = [];

    if (jobsData) {
      jobsData.forEach((r, i) => {
        if (r.status !== "success" || !r.result) return;
        const job       = r.result as any;
        const id        = allIds[i];
        const status    = Number(job.status ?? 0);
        const title     = job.title || shortAddr(id, 6);
        const isEmp     = employerJobIds.includes(id);
        const isAgt     = agentJobIds.includes(id);
        const isMyAgent = agentId && job.assignedAgent === agentId;
        // Include deliverable suffix so each new submission/revision round gets a unique ID
        const dSuf = suf(job.deliverableURI);

        // ── Employer ──────────────────────────────────────────────────────────
        if (isEmp && status === JobStatus.InProgress && !job.deliverableURI)
          fresh.push({ id: `started-${id}`, type: "started", label: "Agent started working", sub: title, href: `/jobs/${id}` });

        if (isEmp && status === JobStatus.Submitted)
          // ID includes deliverable suffix → employer notified for EACH new submission round
          fresh.push({ id: `review-${id}-${dSuf}`, type: "approval_needed", label: "Review deliverable", sub: title, href: `/jobs/${id}` });

        if (isEmp && status === JobStatus.Disputed)
          fresh.push({ id: `disputed-emp-${id}`, type: "disputed", label: "Job is under dispute", sub: title, href: `/jobs/${id}` });

        if (isEmp && status === JobStatus.Resolved)
          fresh.push({ id: `resolved-emp-${id}`, type: "resolved", label: "Dispute resolved", sub: title, href: `/jobs/${id}` });

        // ── Agent ─────────────────────────────────────────────────────────────
        if (isAgt && !isEmp && status === JobStatus.Assigned && isMyAgent)
          fresh.push({ id: `assigned-${id}`, type: "assigned", label: "You were assigned to a job", sub: title, href: `/jobs/${id}` });

        // Revision: InProgress + deliverable = employer sent work back
        // ID includes deliverable suffix → unique per revision round
        if (isAgt && !isEmp && status === JobStatus.InProgress && isMyAgent && job.deliverableURI)
          fresh.push({ id: `revision-${id}-${dSuf}`, type: "revision", label: "Revision requested — tap to read message", sub: title, href: `/jobs/${id}` });

        if (isAgt && status === JobStatus.Completed && isMyAgent)
          fresh.push({ id: `paid-${id}`, type: "completed", label: "Payment released 🎉", sub: title, href: `/jobs/${id}` });

        if (isAgt && status === JobStatus.Disputed && isMyAgent)
          fresh.push({ id: `disputed-agt-${id}`, type: "disputed", label: "Job is under dispute", sub: title, href: `/jobs/${id}` });

        if (isAgt && status === JobStatus.Resolved && isMyAgent)
          fresh.push({ id: `resolved-agt-${id}`, type: "resolved", label: "Dispute resolved — check outcome", sub: title, href: `/jobs/${id}` });

        if (isAgt && status === JobStatus.Cancelled && isMyAgent)
          fresh.push({ id: `cancelled-${id}`, type: "cancelled", label: "Job was cancelled", sub: title, href: `/jobs/${id}` });
      });
    }

    if (applicantsData) {
      applicantsData.forEach((r, i) => {
        if (r.status !== "success" || !r.result) return;
        const ids = r.result as unknown as `0x${string}`[];
        if (ids.length === 0) return;
        const jobId = openEmpIds[i];
        const jobIdx = allIds.indexOf(jobId);
        const jobR  = jobsData?.[jobIdx];
        const title = (jobR?.status === "success" && (jobR.result as any)?.title)
          ? (jobR.result as any).title : shortAddr(jobId, 6);
        // Count in ID → new notification whenever a new applicant arrives
        fresh.push({ id: `applicants-${jobId}-${ids.length}`, type: "applicants", label: `${ids.length} applicant${ids.length > 1 ? "s" : ""} waiting`, sub: title, href: `/jobs/${jobId}` });
      });
    }

    if (fresh.length === 0) return;

    // Merge: only add IDs that are genuinely new (never seen before)
    setStored(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnes: StoredNotif[] = fresh
        .filter(n => !existingIds.has(n.id))
        .map(n => ({ ...n, read: false, addedAt: Date.now() }));
      if (newOnes.length === 0) return prev; // nothing changed
      // Newest first, cap at 100 to keep localStorage lean
      const merged = [...newOnes, ...prev].slice(0, 100);
      saveNotifs(address, merged);
      return merged;
    });
  }, [jobsData, applicantsData]); // eslint-disable-line

  // ── User actions ──────────────────────────────────────────────────────────────

  /** Click notification → mark as read. Stays in list, removed from badge count. */
  const markRead = (id: string) => {
    if (!address) return;
    setStored(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifs(address, updated);
      return updated;
    });
  };

  /** Mark all visible notifications as read (badge → 0, all still in list). */
  const markAllRead = () => {
    if (!address) return;
    setStored(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifs(address, updated);
      return updated;
    });
  };

  /** X button → fully remove a single notification from list. */
  const clearOne = (id: string) => {
    if (!address) return;
    const next = new Set([...cleared, id]);
    setCleared(next);
    saveCleared(address, next);
  };

  // ── Derived display ───────────────────────────────────────────────────────────

  // Show all stored notifications that haven't been explicitly cleared
  const displayed   = stored.filter(n => !cleared.has(n.id));
  const unreadCount = displayed.filter(n => !n.read).length;

  if (!address) return null;

  // ── Render ────────────────────────────────────────────────────────────────────

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
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
            style={{ background: "#6C63FF", fontWeight: 700 }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
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
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
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
                  color: unreadCount > 0 ? "#6C63FF" : "#6B7280",
                  boxShadow: unreadCount > 0
                    ? "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)"
                    : "3px 3px 6px rgb(163,177,198,0.5), -3px -3px 6px rgba(255,255,255,0.4)",
                }}
              >
                {unreadCount}
              </span>
            </div>
          </div>

          {/* List */}
          {displayed.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[13px]" style={{ color: "#6B7280" }}>No notifications</div>
              <div className="text-[12px] mt-1" style={{ color: "#8B95A5" }}>You&apos;re all caught up ✓</div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {displayed.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-5 py-3.5 group"
                  style={{
                    borderBottom: "1px solid rgba(163,177,198,0.2)",
                    opacity: n.read ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Dot — coloured when unread, grey when read */}
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: n.read ? "#B0BAC9" : DOT_COLOR[n.type] }}
                  />

                  {/* Content — click = mark read + navigate */}
                  <Link
                    href={n.href}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className="flex-1 min-w-0 hover:no-underline"
                  >
                    <div
                      className="text-[13px] leading-snug transition-colors"
                      style={{ fontWeight: n.read ? 400 : 600, color: n.read ? "#8B95A5" : "#3D4852" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = n.read ? "#8B95A5" : "#3D4852"}
                    >
                      {n.label}
                    </div>
                    <div className="text-[12px] truncate mt-0.5" style={{ color: "#8B95A5" }}>{n.sub}</div>
                  </Link>

                  {/* X — explicitly remove from list */}
                  <button
                    onClick={e => { e.stopPropagation(); clearOne(n.id); }}
                    className="shrink-0 mt-0.5 cursor-pointer border-0 bg-transparent p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#8B95A5" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
                    title="Remove"
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
