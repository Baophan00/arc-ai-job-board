"use client";

import { useState, useEffect } from "react";
import { useParams }    from "next/navigation";
import Link             from "next/link";
import { Loader2, Send, RotateCcw, CheckCircle2, ExternalLink, ArrowLeft, Star, Shield, Clock, DollarSign, ChevronRight } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast            from "react-hot-toast";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { formatUsdc, formatDeadline, timeAgo, shortAddr } from "@/lib/utils";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import { JobStatus, type Job } from "@/types";

// ─── Shadow constants ─────────────────────────────────────────────────────────

const NEU           = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const NEU_SM        = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const NEU_INSET     = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
const NEU_INSET_SM  = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

// ─── Status styles ─────────────────────────────────────────────────────────────

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

const STATUS_COLOR: Record<number, string> = {
  [JobStatus.Open]:       "#38B2AC",
  [JobStatus.Assigned]:   "#F59E0B",
  [JobStatus.InProgress]: "#F59E0B",
  [JobStatus.Submitted]:  "#6C63FF",
  [JobStatus.Completed]:  "#6B7280",
  [JobStatus.Disputed]:   "#EF4444",
  [JobStatus.Resolved]:   "#6B7280",
  [JobStatus.Cancelled]:  "#8B95A5",
};

const SKILL_HEX: Record<string, string> = {
  solidity:   "#3B82F6",
  rust:       "#EA580C",
  python:     "#CA8A04",
  typescript: "#0284C7",
  defi:       "#059669",
  nft:        "#7C3AED",
  ai:         "#6C63FF",
};

function getSkillColor(s: string): string {
  return SKILL_HEX[s.toLowerCase()] ?? "#6B7280";
}

// ─── Applicant row ────────────────────────────────────────────────────────────

function ApplicantRow({
  agentId,
  onAssign,
  assigning,
  showAssign,
}: {
  agentId: `0x${string}`;
  onAssign: (id: `0x${string}`) => void;
  assigning: boolean;
  showAssign: boolean;
}) {
  const { data: agentRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args:         [agentId],
  });
  const a = agentRaw as any;
  if (!a) return (
    <div className="h-12 rounded-2xl animate-pulse" style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }} />
  );

  return (
    <div
      className="flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200"
      style={{ background: "#E0E5EC", boxShadow: NEU_SM }}
    >
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>{a.name}</span>
          {a.verified && (
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#38B2AC" }} />
          )}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: "#8B95A5" }}>
          Rep {a.reputationScore?.toString() ?? "?"}/100 · {a.jobsCompleted?.toString() ?? "0"} jobs done
        </div>
      </div>
      {showAssign && (
        <button
          onClick={() => onAssign(agentId)}
          disabled={assigning}
          className="text-[12px] px-4 py-1.5 rounded-2xl text-white border-0 cursor-pointer transition-all duration-200 disabled:opacity-50 shrink-0"
          style={{ fontWeight: 600, background: "#6C63FF", boxShadow: NEU_SM }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ""}
        >
          {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign →"}
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId  = params.jobId as `0x${string}`;

  const { address, isConnected } = useAccount();

  const [deliverableURI, setDeliverableURI] = useState("");
  const [revisionNote,   setRevisionNote]   = useState("");
  const [rating,         setRating]         = useState(5);
  const [comment,        setComment]        = useState("");

  // ── Read job from chain ──────────────────────────────────────────────────
  const { data: jobRaw, isLoading, refetch } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getJob",
    args:         [jobId],
  });

  // ── Read applicants ──────────────────────────────────────────────────────
  const { data: applicants, refetch: refetchApplicants } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getApplications",
    args:         [jobId],
    query:        { refetchInterval: 10_000 },
  });
  const applicantIds = (applicants as `0x${string}`[] | undefined) ?? [];

  // ── My agent ─────────────────────────────────────────────────────────────
  const { data: myAgentRaw } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgentByWallet",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  const myAgent   = myAgentRaw as any;
  const hasAgent  = !!myAgent && myAgent.agentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  // ── Assigned agent wallet (for reliable role detection) ──────────────────
  const rawAssignedAgentId = (jobRaw as any)?.assignedAgent as `0x${string}` | undefined;
  const hasAssignedAgent   = !!rawAssignedAgentId
    && rawAssignedAgentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  const { data: assignedAgentData } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args:         rawAssignedAgentId ? [rawAssignedAgentId] : undefined,
    query:        { enabled: hasAssignedAgent },
  });
  const assignedAgentWallet = (assignedAgentData as any)?.wallet as `0x${string}` | undefined;

  const [lastAction, setLastAction] = useState("");

  const { writeContract, data: txHash, isPending, isError: txError, error: txErr } = useWriteContract();
  const { isLoading: isMining, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const loading = isPending || isMining;

  useEffect(() => {
    if (!txSuccess || !lastAction) return;
    const MSG: Record<string, string> = {
      assignAgent:       "Agent assigned ✓",
      startJob:          "Job started — you are now In Progress",
      submitDeliverable: "Deliverable submitted ✓",
      approveWork:       "Payment released — job complete! ✓",
      requestRevision:   "Revision requested",
      cancelJob:         "Job cancelled — USDC refunded",
      applyForJob:       "Application submitted ✓",
    };
    toast.success(MSG[lastAction] ?? "Transaction confirmed ✓");
    refetch();
    refetchApplicants();
  }, [txSuccess]);  // eslint-disable-line

  useEffect(() => {
    if (!txError || !txErr) return;
    const msg = txErr.message ?? "";
    if (msg.includes("User rejected") || msg.includes("user rejected")) {
      toast.error("Transaction cancelled");
    } else if (msg.includes("NotRegisteredAgent")) {
      toast.error("You need to register an agent first");
    } else if (msg.includes("NotEmployer")) {
      toast.error("Only the employer can do this");
    } else {
      toast.error(msg.slice(0, 80));
    }
  }, [txError]);  // eslint-disable-line

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-[13px] mb-6 hover:no-underline transition-colors"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[14px] animate-pulse" style={{ color: "#6B7280" }}>Loading job data...</div>
        </div>
      </div>
    );
  }

  if (!jobRaw) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-[13px] mb-6 hover:no-underline transition-colors"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[16px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>Job not found</div>
          <div className="text-[13px] font-mono" style={{ color: "#8B95A5" }}>{jobId}</div>
        </div>
      </div>
    );
  }

  const job       = jobRaw as unknown as Job;
  const statusIdx = Number(job.status ?? 0);
  const statusColor = STATUS_COLOR[statusIdx] ?? "#8B95A5";

  // ── Role detection ────────────────────────────────────────────────────────
  const norm = (s: string | undefined) => s?.toLowerCase() ?? "";

  const isEmployer = !!address && norm(address) === norm((job as any).employer);
  const isAssignedAgent = hasAssignedAgent
    && !!address
    && !!assignedAgentWallet
    && norm(address) === norm(assignedAgentWallet);

  const myAgentId  = norm(myAgent?.agentId);
  const hasApplied = hasAgent && myAgentId !== "" && applicantIds.some(id => norm(id) === myAgentId);
  const jobStatus  = Number(job.status ?? 0);
  const canApply   = hasAgent && jobStatus === JobStatus.Open && !hasApplied && !isEmployer;

  const platformFee = (job.budget * 250n) / 10000n;

  const tx = (fn: string, args: unknown[]) => {
    setLastAction(fn);
    writeContract({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: fn as any,
      args:         args as any,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-[13px] mb-6 hover:no-underline transition-colors"
        style={{ color: "#6B7280" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      {/* Transaction status banners */}
      {isPending && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 text-[13px] rounded-2xl" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#F59E0B" }}>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Waiting for wallet confirmation...
        </div>
      )}
      {isMining && txHash && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 text-[13px] rounded-2xl" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#6C63FF" }}>
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Transaction on-chain...{" "}
          <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "#6C63FF", textDecoration: "underline" }}>
            {shortAddr(txHash, 8)} ↗
          </a>
        </div>
      )}
      {txSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 text-[13px] rounded-2xl" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#38B2AC" }}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Transaction confirmed ✓
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <div className="rounded-[32px] p-6" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] mb-1 font-mono" style={{ color: "#8B95A5" }}>#{String(job.jobId).slice(-8)}</div>
                <h1
                  className="text-[22px] leading-tight"
                  style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
                >
                  {job.title}
                </h1>
                <div className="text-[13px] mt-1.5">
                  <span style={{ color: "#6B7280" }}>by </span>
                  <a
                    href={`${ARC_EXPLORER_URL}/address/${job.employer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:no-underline transition-colors"
                    style={{ color: "#6C63FF", fontWeight: 500 }}
                  >
                    {shortAddr(job.employer)} ↗
                  </a>
                </div>
              </div>
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] shrink-0"
                style={{ fontWeight: 600, color: statusColor, background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                {STATUS_LABEL[statusIdx] ?? "Unknown"}
              </span>
            </div>

            {/* Skills */}
            {job.requiredSkills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full text-[12px]"
                    style={{ fontWeight: 500, color: getSkillColor(s), background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-[32px] p-6" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <h2
              className="text-[14px] mb-3"
              style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
            >
              Description
            </h2>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: "#6B7280" }}>
              {job.description}
            </p>
          </div>

          {/* Deliverable (if submitted) */}
          {job.deliverableURI && (
            <div className="rounded-[24px] p-4" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4" style={{ color: "#6C63FF" }} />
                <span className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>Deliverable Submitted</span>
              </div>
              <a
                href={job.deliverableURI}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] break-all"
                style={{ color: "#6C63FF" }}
              >
                {job.deliverableURI}
              </a>
            </div>
          )}

          {/* ── Agent Actions ──────────────────────────────────────────────── */}
          {isConnected && !isEmployer && (
            <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
              <h2
                className="text-[14px] mb-4"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                Your Actions
              </h2>
              <div className="space-y-3">

                {/* Case 1: Not registered */}
                {!hasAgent && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#EF4444" }}>
                      You need to register an agent before you can apply for jobs.
                    </div>
                    <Link href="/register" className="btn-primary w-full justify-center">
                      Register Agent First →
                    </Link>
                  </div>
                )}

                {/* Case 2: Has agent */}
                {hasAgent && (
                  <>
                    <div className="text-[12px]" style={{ color: "#8B95A5" }}>
                      Acting as: <span style={{ color: "#3D4852", fontWeight: 500 }}>{myAgent?.name}</span>
                    </div>

                    {/* Assigned agent actions */}
                    {isAssignedAgent && (
                      <>
                        <div className="flex items-center gap-2 p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#38B2AC" }}>
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          You are the assigned agent
                        </div>

                        {jobStatus === JobStatus.Assigned && (
                          <button
                            onClick={() => tx("startJob", [job.jobId])}
                            disabled={loading}
                            className="btn-primary w-full justify-center py-3 text-[14px]"
                          >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirm and Start Working
                          </button>
                        )}

                        {jobStatus === JobStatus.InProgress && (
                          <div className="space-y-3">
                            <input
                              type="url"
                              placeholder="ipfs:// or https:// — your deliverable link"
                              value={deliverableURI}
                              onChange={(e) => setDeliverableURI(e.target.value)}
                              className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300"
                              style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
                              onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)"}
                              onBlur={e  => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                            />
                            <button
                              onClick={() => {
                                if (!deliverableURI) return toast.error("Add a deliverable link first");
                                tx("submitDeliverable", [job.jobId, deliverableURI]);
                              }}
                              disabled={loading || !deliverableURI}
                              className="btn-primary w-full justify-center py-3"
                            >
                              <Send className="h-4 w-4" /> Submit Deliverable
                            </button>
                          </div>
                        )}

                        {jobStatus === JobStatus.Submitted && (
                          <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#F59E0B" }}>
                            Deliverable submitted — waiting for employer review.
                          </div>
                        )}

                        {jobStatus === JobStatus.Completed && (
                          <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#38B2AC" }}>
                            ✓ Job completed — payment released!
                          </div>
                        )}
                      </>
                    )}

                    {/* Applied but not assigned */}
                    {hasApplied && !isAssignedAgent && (
                      <>
                        {jobStatus === JobStatus.Open && (
                          <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#F59E0B" }}>
                            Application submitted — waiting for employer to assign.
                          </div>
                        )}
                        {jobStatus !== JobStatus.Open && (
                          <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#6B7280" }}>
                            Another agent was selected for this job.
                          </div>
                        )}
                      </>
                    )}

                    {/* Can apply */}
                    {canApply && (
                      <button
                        onClick={() => tx("applyForJob", [job.jobId])}
                        disabled={loading}
                        className="btn-primary w-full justify-center py-3 text-[14px]"
                      >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Apply for This Job
                      </button>
                    )}

                    {/* Not open, not applied, not assigned */}
                    {!canApply && !hasApplied && !isAssignedAgent && (
                      <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#6B7280" }}>
                        This job is not accepting applications.
                        <span className="ml-1" style={{ color: "#8B95A5" }}>Status: {STATUS_LABEL[statusIdx]}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Connect wallet prompt */}
          {!isConnected && (
            <div className="rounded-[32px] p-6 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
              <p className="text-[14px] mb-1" style={{ color: "#6B7280" }}>Connect your wallet to apply or manage this job</p>
              <p className="text-[12px]" style={{ color: "#8B95A5" }}>Use the Connect button in the top navigation</p>
            </div>
          )}

          {/* ── Employer Actions ───────────────────────────────────────────── */}
          {isConnected && isEmployer && (
            <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
              <h2
                className="text-[14px] mb-4"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                Employer Actions
              </h2>
              <div className="space-y-3">

                {jobStatus === JobStatus.Open && applicantIds.length > 0 && (
                  <div className="p-3 rounded-2xl text-[13px]" style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#6C63FF" }}>
                    {applicantIds.length} agent{applicantIds.length > 1 ? "s" : ""} applied — see sidebar to assign.
                  </div>
                )}

                {(jobStatus === JobStatus.Open || jobStatus === JobStatus.Assigned) && (
                  <button
                    onClick={() => tx("cancelJob", [job.jobId])}
                    disabled={loading}
                    className="w-full py-2.5 text-[13px] rounded-2xl cursor-pointer border-0 transition-all duration-300"
                    style={{ fontWeight: 600, color: "#EF4444", background: "#E0E5EC", boxShadow: NEU_SM }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_SM}
                  >
                    Cancel Job &amp; Refund USDC
                  </button>
                )}

                {jobStatus === JobStatus.Submitted && (
                  <div className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="block text-[13px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>Rating</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map((r) => (
                          <button
                            key={r}
                            onClick={() => setRating(r)}
                            className="flex-1 py-2.5 rounded-2xl text-[13px] cursor-pointer border-0 transition-all duration-200"
                            style={{
                              fontWeight: 600,
                              background: "#E0E5EC",
                              color: rating === r ? "#F59E0B" : "#6B7280",
                              boxShadow: rating === r ? NEU_INSET_SM : NEU_SM,
                            }}
                          >
                            {r} <Star className="inline h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <textarea
                      placeholder="Optional feedback comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300 resize-none"
                      style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
                      onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)"}
                      onBlur={e  => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                    />

                    <button
                      onClick={() => tx("approveWork", [job.jobId, rating, comment])}
                      disabled={loading}
                      className="btn-primary w-full justify-center py-3"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve &amp; Release Payment
                    </button>

                    <div
                      className="pt-4 space-y-3"
                      style={{ borderTop: "1px solid rgba(163,177,198,0.35)" }}
                    >
                      <textarea
                        placeholder="Request revision — describe what needs changing..."
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300 resize-none"
                        style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
                        onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)"}
                        onBlur={e  => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                      />
                      <button
                        onClick={() => {
                          if (!revisionNote) return toast.error("Describe what needs changing");
                          tx("requestRevision", [job.jobId, revisionNote]);
                        }}
                        disabled={loading}
                        className="w-full py-2.5 text-[13px] rounded-2xl cursor-pointer border-0 transition-all duration-300 flex items-center justify-center gap-2"
                        style={{ fontWeight: 600, color: "#F59E0B", background: "#E0E5EC", boxShadow: NEU_SM }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_SM}
                      >
                        <RotateCcw className="h-4 w-4" /> Request Revision
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Budget card */}
          <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
              >
                <DollarSign className="h-4 w-4" style={{ color: "#6C63FF" }} />
              </div>
              <span className="text-[13px]" style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}>Budget</span>
            </div>
            <div
              className="text-[30px] mb-1"
              style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#6C63FF" }}
            >
              {formatUsdc(job.budget)}
            </div>
            <div className="text-[12px]" style={{ color: "#8B95A5" }}>USDC locked in escrow</div>
            <div
              className="mt-4 space-y-2 pt-4 text-[13px]"
              style={{ borderTop: "1px solid rgba(163,177,198,0.35)" }}
            >
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Platform fee (2.5%)</span>
                <span style={{ color: "#6B7280" }}>{formatUsdc(platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Agent earns</span>
                <span style={{ fontWeight: 600, color: "#38B2AC" }}>{formatUsdc(job.budget - platformFee)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
              >
                <Clock className="h-4 w-4" style={{ color: "#F59E0B" }} />
              </div>
              <span className="text-[13px]" style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}>Timeline</span>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Posted</span>
                <span style={{ color: "#3D4852" }}>{timeAgo(job.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#6B7280" }}>Deadline</span>
                <span style={{ fontWeight: 500, color: "#F59E0B" }}>{formatDeadline(job.deadline)}</span>
              </div>
              {job.completedAt > 0n && (
                <div className="flex justify-between">
                  <span style={{ color: "#6B7280" }}>Completed</span>
                  <span style={{ color: "#3D4852" }}>{timeAgo(job.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Applicants */}
          {(jobStatus === JobStatus.Open || jobStatus === JobStatus.Assigned) && (
            <div className="rounded-[32px] overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU }}>
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(163,177,198,0.35)" }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: "#6B7280" }} />
                  <span className="text-[13px]" style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}>Applicants</span>
                </div>
                <span
                  className="text-[12px] px-2.5 py-0.5 rounded-full"
                  style={{ fontWeight: 600, color: "#6C63FF", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  {applicantIds.length}
                </span>
              </div>
              <div className="p-4 space-y-2.5">
                {applicantIds.length === 0 ? (
                  <div className="text-[13px] text-center py-4 animate-pulse" style={{ color: "#8B95A5" }}>
                    Waiting for applications...
                  </div>
                ) : (
                  <>
                    {applicantIds.map((id) => (
                      <ApplicantRow
                        key={id}
                        agentId={id}
                        onAssign={(agentId) => tx("assignAgent", [job.jobId, agentId])}
                        assigning={loading}
                        showAssign={isEmployer && jobStatus === JobStatus.Open}
                      />
                    ))}
                    {!isEmployer && (
                      <p className="text-[11px] pt-1" style={{ color: "#8B95A5" }}>Only the employer can assign agents.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Job ID */}
          <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div className="text-[12px] mb-2" style={{ fontWeight: 600, color: "#6B7280" }}>Job ID</div>
            <p className="text-[11px] break-all font-mono mb-3" style={{ color: "#8B95A5" }}>{job.jobId}</p>
            <a
              href={`${ARC_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.jobRegistry}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] hover:no-underline transition-colors"
              style={{ color: "#6C63FF" }}
            >
              View on ArcScan <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
