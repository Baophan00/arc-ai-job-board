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
  id:    string;
  type:  NotifType;
  label: string;
  sub:   string;
  href:  string;
}

const ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";

const DOT_COLOR: Record<NotifType, string> = {
  approval_needed: "#F59E0B",
  assigned:        "#6C63FF",
  completed:       "#38B2AC",
  applicants:      "#6C63FF",
};

export function NotificationBell() {
  const { address } = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

      if (isEmp && status === JobStatus.Submitted) {
        notifs.push({ id: `submitted-${id}`, type: "approval_needed", label: "Review deliverable", sub: title, href: `/jobs/${id}` });
      }
      if (isAgt && !isEmp && status === JobStatus.Assigned && agentId && job.assignedAgent === agentId) {
        notifs.push({ id: `assigned-${id}`, type: "assigned", label: "You were assigned", sub: title, href: `/jobs/${id}` });
      }
      if (isAgt && status === JobStatus.Completed && agentId && job.assignedAgent === agentId) {
        notifs.push({ id: `paid-${id}`, type: "completed", label: "Payment released", sub: title, href: `/jobs/${id}` });
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
      notifs.push({ id: `applicants-${jobId}`, type: "applicants", label: `${ids.length} new applicant${ids.length > 1 ? "s" : ""}`, sub: title, href: `/jobs/${jobId}` });
    });
  }

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
            <span className="text-[13px] font-semibold text-[#3D4852]" style={{ fontWeight: 600 }}>
              Notifications
            </span>
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
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

          {/* List */}
          {count === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[13px] text-[#6B7280]">No new notifications</div>
              <div className="text-[12px] text-[#8B95A5] mt-1">You&apos;re all caught up ✓</div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-5 py-3.5 transition-all duration-200 hover:no-underline group"
                  style={{ borderBottom: "1px solid rgba(163,177,198,0.2)" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: DOT_COLOR[n.type] }}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#3D4852] leading-snug group-hover:text-[#6C63FF] transition-colors">
                      {n.label}
                    </div>
                    <div className="text-[12px] text-[#6B7280] truncate mt-0.5">{n.sub}</div>
                  </div>
                </Link>
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
