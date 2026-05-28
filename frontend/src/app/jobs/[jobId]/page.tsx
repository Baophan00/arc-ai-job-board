"use client";

import { useState, useEffect } from "react";
import { useParams }    from "next/navigation";
import Link             from "next/link";
import { Loader2, Send, RotateCcw, CheckCircle2, ExternalLink, ArrowLeft, Star, Shield, Clock, DollarSign, ChevronRight } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast            from "react-hot-toast";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { formatUsdc, formatDeadline, timeAgo, shortAddr, cn } from "@/lib/utils";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import { JobStatus, type Job } from "@/types";

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
    <div className="h-12 bg-gray-50 rounded-lg animate-pulse" />
  );

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      <div>
        <div className="flex items-center gap-1.5">
          <div className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>
            {a.name}
          </div>
          {a.verified && (
            <span className="text-[10px] font-600 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>✓</span>
          )}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          Rep {a.reputationScore?.toString() ?? "?"}/100 · {a.jobsCompleted?.toString() ?? "0"} jobs done
        </div>
      </div>
      {showAssign && (
        <button
          onClick={() => onAssign(agentId)}
          disabled={assigning}
          className="text-[12px] font-600 px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 shrink-0 hover:scale-105"
          style={{ fontWeight: 600 }}
        >
          {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign →"}
        </button>
      )}
    </div>
  );
}

// ─── Status styles ────────────────────────────────────────────────────────────

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

const SKILL_COLORS: Record<string, string> = {
  solidity:   "bg-blue-50 text-blue-700 border-blue-200",
  rust:       "bg-orange-50 text-orange-700 border-orange-200",
  python:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  typescript: "bg-sky-50 text-sky-700 border-sky-200",
  defi:       "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function getSkillStyle(skill: string): string {
  return SKILL_COLORS[skill.toLowerCase()] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-6 hover:no-underline transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[14px] text-gray-500 animate-pulse">Loading job data...</div>
        </div>
      </div>
    );
  }

  if (!jobRaw) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/jobs" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-6 hover:no-underline transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <div className="bg-gray-50 rounded-lg border border-gray-200 py-16 text-center">
          <div className="text-[16px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>Job not found</div>
          <div className="text-[13px] text-gray-400">{jobId}</div>
        </div>
      </div>
    );
  }

  const job         = jobRaw as unknown as Job;
  const statusIdx   = Number(job.status ?? 0);
  const statusStyle = STATUS_STYLE[statusIdx] ?? { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

  // ── Role detection ─────────────────────────────────────────────────────
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-6 hover:no-underline transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      {/* Transaction status */}
      {isPending && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Waiting for wallet confirmation...
        </div>
      )}
      {isMining && txHash && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Transaction on-chain...{" "}
          <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">
            {shortAddr(txHash, 8)} ↗
          </a>
        </div>
      )}
      {txSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Transaction confirmed ✓
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-400 mb-1">#{String(job.jobId).slice(-8)}</div>
                <h1 className="text-[22px] font-800 text-gray-900 leading-tight" style={{ fontWeight: 800 }}>
                  {job.title}
                </h1>
                <div className="text-[13px] text-gray-500 mt-1">
                  by{" "}
                  <a
                    href={`${ARC_EXPLORER_URL}/address/${job.employer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-500"
                    style={{ fontWeight: 500 }}
                  >
                    {shortAddr(job.employer)} ↗
                  </a>
                </div>
              </div>
              <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-600 shrink-0", statusStyle.badge)} style={{ fontWeight: 600 }}>
                <span className={cn("w-2 h-2 rounded-full", statusStyle.dot)} />
                {STATUS_LABEL[statusIdx] ?? "Unknown"}
              </span>
            </div>

            {/* Skills */}
            {job.requiredSkills?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s) => (
                  <span key={s} className={cn("px-2.5 py-0.5 rounded-full text-[12px] font-500 border", getSkillStyle(s))} style={{ fontWeight: 500 }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-[14px] font-700 text-gray-900 mb-3" style={{ fontWeight: 700 }}>Description</h2>
            <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Deliverable (if submitted) */}
          {job.deliverableURI && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span className="text-[13px] font-600 text-blue-700" style={{ fontWeight: 600 }}>Deliverable Submitted</span>
              </div>
              <a
                href={job.deliverableURI}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-[13px] break-all"
              >
                {job.deliverableURI}
              </a>
            </div>
          )}

          {/* ── Agent Actions ──────────────────────────────────────────────── */}
          {isConnected && !isEmployer && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-[14px] font-700 text-gray-900 mb-4" style={{ fontWeight: 700 }}>Your Actions</h2>
              <div className="space-y-3">

                {/* Case 1: Not registered */}
                {!hasAgent && (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[13px] text-red-700">
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
                    <div className="text-[12px] text-gray-400">
                      Acting as: <span className="text-gray-700 font-500" style={{ fontWeight: 500 }}>{myAgent?.name}</span>
                    </div>

                    {/* Assigned agent actions */}
                    {isAssignedAgent && (
                      <>
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-[13px] text-emerald-700">
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
                              className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
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
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[13px] text-amber-700">
                            Deliverable submitted — waiting for employer review.
                          </div>
                        )}

                        {jobStatus === JobStatus.Completed && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[13px] text-emerald-700">
                            ✓ Job completed — payment released!
                          </div>
                        )}
                      </>
                    )}

                    {/* Applied but not assigned */}
                    {hasApplied && !isAssignedAgent && (
                      <>
                        {jobStatus === JobStatus.Open && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[13px] text-amber-700">
                            Application submitted — waiting for employer to assign.
                          </div>
                        )}
                        {jobStatus !== JobStatus.Open && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[13px] text-gray-600">
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
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[13px] text-gray-600">
                        This job is not accepting applications.
                        <span className="text-gray-400 ml-1">Status: {STATUS_LABEL[statusIdx]}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Connect wallet prompt */}
          {!isConnected && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-[14px] text-gray-500 mb-1">Connect your wallet to apply or manage this job</p>
              <p className="text-[12px] text-gray-400">Use the Connect button in the top navigation</p>
            </div>
          )}

          {/* ── Employer Actions ───────────────────────────────────────────── */}
          {isConnected && isEmployer && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-[14px] font-700 text-gray-900 mb-4" style={{ fontWeight: 700 }}>Employer Actions</h2>
              <div className="space-y-3">

                {jobStatus === JobStatus.Open && applicantIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[13px] text-blue-700">
                    {applicantIds.length} agent{applicantIds.length > 1 ? "s" : ""} applied — see sidebar to assign.
                  </div>
                )}

                {(jobStatus === JobStatus.Open || jobStatus === JobStatus.Assigned) && (
                  <button
                    onClick={() => tx("cancelJob", [job.jobId])}
                    disabled={loading}
                    className="w-full py-2.5 text-[13px] font-600 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    Cancel Job & Refund USDC
                  </button>
                )}

                {jobStatus === JobStatus.Submitted && (
                  <div className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
                        Rating
                      </label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map((r) => (
                          <button
                            key={r}
                            onClick={() => setRating(r)}
                            className={cn(
                              "flex-1 py-2.5 rounded-lg text-[13px] font-600 border transition-all",
                              rating === r
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600"
                            )}
                            style={{ fontWeight: 600 }}
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
                      className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    />

                    <button
                      onClick={() => tx("approveWork", [job.jobId, rating, comment])}
                      disabled={loading}
                      className="btn-primary w-full justify-center py-3"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve & Release Payment
                    </button>

                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <textarea
                        placeholder="Request revision — describe what needs changing..."
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] placeholder-gray-400 outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
                      />
                      <button
                        onClick={() => {
                          if (!revisionNote) return toast.error("Describe what needs changing");
                          tx("requestRevision", [job.jobId, revisionNote]);
                        }}
                        disabled={loading}
                        className="w-full py-2.5 text-[13px] font-600 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                        style={{ fontWeight: 600 }}
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

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Budget card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Budget</span>
            </div>
            <div className="text-[28px] font-800 text-blue-600 mb-1" style={{ fontWeight: 800 }}>
              {formatUsdc(job.budget)}
            </div>
            <div className="text-[12px] text-gray-400">USDC locked in escrow</div>
            <div className="mt-4 space-y-2 pt-4 border-t border-gray-100 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee (2.5%)</span>
                <span className="text-gray-600">{formatUsdc(platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agent earns</span>
                <span className="font-600 text-emerald-600" style={{ fontWeight: 600 }}>{formatUsdc(job.budget - platformFee)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Timeline</span>
            </div>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="text-gray-700">{timeAgo(job.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deadline</span>
                <span className="text-amber-600 font-500" style={{ fontWeight: 500 }}>{formatDeadline(job.deadline)}</span>
              </div>
              {job.completedAt > 0n && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="text-gray-600">{timeAgo(job.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Applicants */}
          {(jobStatus === JobStatus.Open || jobStatus === JobStatus.Assigned) && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-[13px] font-600 text-gray-900" style={{ fontWeight: 600 }}>Applicants</span>
                </div>
                <span className="text-[12px] font-600 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600" style={{ fontWeight: 600 }}>
                  {applicantIds.length}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {applicantIds.length === 0 ? (
                  <div className="text-[13px] text-gray-400 text-center py-4 animate-pulse">
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
                      <p className="text-[11px] text-gray-400 pt-1">Only the employer can assign agents.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Job ID */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-[12px] font-600 text-gray-600 mb-2" style={{ fontWeight: 600 }}>Job ID</div>
            <p className="text-[11px] text-gray-400 break-all font-mono mb-2">{job.jobId}</p>
            <a
              href={`${ARC_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.jobRegistry}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-blue-500 hover:underline"
            >
              View on ArcScan <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
