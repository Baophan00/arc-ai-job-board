"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Link from "next/link";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { cn, shortAddr } from "@/lib/utils";
import { JobStatus } from "@/types";

type NotifType = "approval_needed" | "assigned" | "completed" | "applicants";

interface Notif {
  id:      string;
  type:    NotifType;
  label:   string;
  sub:     string;
  href:    string;
}

const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

export function NotificationBell() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Employer jobs ──────────────────────────────────────────────────────────
  const { data: empIds } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getEmployerJobs",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, refetchInterval: 20_000 },
  });

  // ── Agent info ─────────────────────────────────────────────────────────────
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

  // ── Agent jobs ─────────────────────────────────────────────────────────────
  const { data: agentJobIdsRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getAgentJobs",
    args:         agentId ? [agentId] : undefined,
    query:        { enabled: !!agentId, refetchInterval: 20_000 },
  });

  const employerJobIds = (empIds as `0x${string}`[] | undefined) ?? [];
  const agentJobIds    = (agentJobIdsRaw as `0x${string}`[] | undefined) ?? [];

  // Merge unique IDs
  const allIds = [...new Set([...employerJobIds, ...agentJobIds])];

  // ── Batch read job data ────────────────────────────────────────────────────
  const { data: jobsData } = useReadContracts({
    contracts: allIds.map((id) => ({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "getJob",
      args:         [id],
    })),
    query: { enabled: allIds.length > 0, refetchInterval: 20_000 },
  });

  // ── Also read applicant counts for employer's Open jobs ───────────────────
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

  // ── Build notification list ────────────────────────────────────────────────
  const notifs: Notif[] = [];

  if (jobsData) {
    jobsData.forEach((r, i) => {
      if (r.status !== "success" || !r.result) return;
      const job    = r.result as any;
      const id     = allIds[i];
      const status = Number(job.status ?? 0);
      const title  = job.title ? job.title : shortAddr(id, 6);
      const isEmp  = employerJobIds.includes(id);
      const isAgt  = agentJobIds.includes(id);

      // Employer: deliverable submitted → needs approval
      if (isEmp && status === JobStatus.Submitted) {
        notifs.push({
          id:   `submitted-${id}`,
          type: "approval_needed",
          label: "Review deliverable",
          sub:   title,
          href: `/jobs/${id}`,
        });
      }

      // Agent: assigned to job → needs to start
      if (isAgt && !isEmp && status === JobStatus.Assigned) {
        if (agentId && job.assignedAgent === agentId) {
          notifs.push({
            id:   `assigned-${id}`,
            type: "assigned",
            label: "You were assigned",
            sub:   title,
            href: `/jobs/${id}`,
          });
        }
      }

      // Agent: job completed → payment received
      if (isAgt && status === JobStatus.Completed) {
        if (agentId && job.assignedAgent === agentId) {
          notifs.push({
            id:   `paid-${id}`,
            type: "completed",
            label: "Payment released",
            sub:   title,
            href: `/jobs/${id}`,
          });
        }
      }
    });
  }

  // Employer: open jobs with applicants waiting
  if (applicantsData) {
    applicantsData.forEach((r, i) => {
      if (r.status !== "success" || !r.result) return;
      const ids = r.result as unknown as `0x${string}`[];
      if (ids.length === 0) return;
      const jobId = openEmpIds[i];
      const jobIdx = allIds.indexOf(jobId);
      const jobR   = jobsData?.[jobIdx];
      const title  = (jobR?.status === "success" && (jobR.result as any)?.title)
        ? (jobR.result as any).title
        : shortAddr(jobId, 6);
      notifs.push({
        id:   `applicants-${jobId}`,
        type: "applicants",
        label: `${ids.length} new applicant${ids.length > 1 ? "s" : ""}`,
        sub:   title,
        href: `/jobs/${jobId}`,
      });
    });
  }

  // Don't render if wallet not connected
  if (!address) return null;

  const count = notifs.length;

  const ICON_COLOR: Record<NotifType, string> = {
    approval_needed: "bg-amber-100 text-amber-600",
    assigned:        "bg-blue-100 text-blue-600",
    completed:       "bg-emerald-100 text-emerald-600",
    applicants:      "bg-blue-100 text-blue-600",
  };

  const DOT_COLOR: Record<NotifType, string> = {
    approval_needed: "bg-amber-500",
    assigned:        "bg-blue-500",
    completed:       "bg-emerald-500",
    applicants:      "bg-blue-500",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-md transition-all",
          open
            ? "bg-blue-50 text-blue-600"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-700 rounded-full flex items-center justify-center px-1" style={{ fontWeight: 700 }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg z-50 shadow-lg overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>
              Notifications
            </span>
            <span className={cn(
              "text-[12px] font-600 px-2 py-0.5 rounded-full",
              count > 0 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
            )} style={{ fontWeight: 600 }}>
              {count}
            </span>
          </div>

          {/* List */}
          {count === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-[13px] text-gray-500">No new notifications</div>
              <div className="text-[12px] text-gray-400 mt-1">You&apos;re all caught up ✓</div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0",
                    "hover:bg-gray-50 transition-colors hover:no-underline"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", DOT_COLOR[n.type])} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-500 text-gray-900 leading-snug" style={{ fontWeight: 500 }}>
                      {n.label}
                    </div>
                    <div className="text-[12px] text-gray-500 truncate mt-0.5">
                      {n.sub}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-[13px] text-blue-500 hover:text-blue-700 transition-colors font-500 hover:no-underline"
              style={{ fontWeight: 500 }}
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
