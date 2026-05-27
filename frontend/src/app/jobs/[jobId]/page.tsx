"use client";

import { useState }          from "react";
import { useParams }          from "next/navigation";
import Link                   from "next/link";
import {
  ArrowLeft, DollarSign, Clock, Briefcase, User, FileText,
  CheckCircle2, AlertTriangle, Loader2, Send, RotateCcw,
} from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import toast                  from "react-hot-toast";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, JOB_STATUS } from "@/lib/contracts";
import { formatUsdc, formatDeadline, timeAgo, shortAddr, skillColor } from "@/lib/utils";
import { cn }                 from "@/lib/utils";
import { JobStatus, type Job } from "@/types";

// Demo job — replace with useReadContract({ functionName: "getJob", args: [jobId] })
function useDemoJob(jobId: string): Job {
  return {
    jobId:          jobId as `0x${string}`,
    employer:       "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as `0x${string}`,
    assignedAgent:  "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    title:          "Build a DeFi yield optimiser agent",
    description:    `Implement an AI agent that:

1. Monitors multiple DeFi protocols on Arc for yield opportunities
2. Automatically reallocates USDC to the highest-yield strategy
3. Respects configurable risk parameters (max APY slippage, min liquidity)
4. Produces a daily summary report stored at an IPFS URI

**Deliverables:**
- Working agent code (Python or TypeScript)
- Deployment documentation
- Test suite with Arc Testnet integration
- IPFS-hosted summary of first 24h operation`,
    requiredSkills: ["DeFi", "Solidity", "Python", "Arc Chain", "USDC"],
    budget:         BigInt(500_000_000),
    deadline:       BigInt(Math.floor(Date.now() / 1000) + 7 * 86400),
    status:         JobStatus.Open,
    deliverableURI: "",
    jobURI:         "ipfs://QmXyz/job-details.json",
    platformFee:    BigInt(12_500_000),
    createdAt:      BigInt(Math.floor(Date.now() / 1000) - 3600),
    completedAt:    0n,
  };
}

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const { address, isConnected } = useAccount();
  const job = useDemoJob(params.jobId);

  const [deliverableURI, setDeliverableURI] = useState("");
  const [revisionNote,   setRevisionNote]   = useState("");
  const [disputeReason,  setDisputeReason]  = useState("");
  const [rating,         setRating]         = useState(5);
  const [comment,        setComment]        = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isMining }  = useWaitForTransactionReceipt({ hash: txHash });
  const loading = isPending || isMining;

  const isEmployer = address?.toLowerCase() === job.employer.toLowerCase();

  const handleApply = () => {
    writeContract({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "applyForJob",
      args:         [job.jobId],
    });
    toast.success("Application submitted!");
  };

  const handleStart = () => {
    writeContract({ address: CONTRACT_ADDRESSES.jobRegistry, abi: JOB_REGISTRY_ABI, functionName: "startJob", args: [job.jobId] });
  };

  const handleSubmit = () => {
    if (!deliverableURI) return toast.error("Add a deliverable URI first");
    writeContract({ address: CONTRACT_ADDRESSES.jobRegistry, abi: JOB_REGISTRY_ABI, functionName: "submitDeliverable", args: [job.jobId, deliverableURI] });
  };

  const handleApprove = () => {
    writeContract({ address: CONTRACT_ADDRESSES.jobRegistry, abi: JOB_REGISTRY_ABI, functionName: "approveWork", args: [job.jobId, rating, comment] });
  };

  const handleRevision = () => {
    if (!revisionNote) return toast.error("Describe what needs changing");
    writeContract({ address: CONTRACT_ADDRESSES.jobRegistry, abi: JOB_REGISTRY_ABI, functionName: "requestRevision", args: [job.jobId, revisionNote] });
  };

  const handleCancel = () => {
    writeContract({ address: CONTRACT_ADDRESSES.jobRegistry, abi: JOB_REGISTRY_ABI, functionName: "cancelJob", args: [job.jobId] });
  };

  const statusLabel = JOB_STATUS[job.status as keyof typeof JOB_STATUS];

  const STATUS_COLORS: Record<number, string> = {
    [JobStatus.Open]:       "text-cyber-400",
    [JobStatus.Assigned]:   "text-blue-400",
    [JobStatus.InProgress]: "text-arc-300",
    [JobStatus.Submitted]:  "text-yellow-400",
    [JobStatus.Completed]:  "text-green-400",
    [JobStatus.Disputed]:   "text-red-400",
    [JobStatus.Resolved]:   "text-purple-400",
    [JobStatus.Cancelled]:  "text-gray-400",
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      <Link href="/jobs" className="btn-ghost inline-flex items-center gap-1.5 mb-6 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">{job.title}</h1>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Posted by {shortAddr(job.employer)}
                </p>
              </div>
              <span className={cn("text-sm font-bold shrink-0", STATUS_COLORS[job.status])}>
                {statusLabel}
              </span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {job.requiredSkills.map((s) => (
                <span key={s} className={cn("px-2.5 py-1 text-xs font-medium rounded-lg border", skillColor(s))}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Description
            </h2>
            <div className="prose prose-sm prose-invert max-w-none text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Deliverable (if submitted) */}
          {job.deliverableURI && (
            <div className="card border-green-500/20">
              <h2 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                Submitted Deliverable
              </h2>
              <a
                href={job.deliverableURI}
                target="_blank"
                rel="noopener noreferrer"
                className="text-arc-300 hover:text-arc-200 text-sm break-all flex items-center gap-1"
              >
                <FileText className="h-4 w-4 shrink-0" />
                {job.deliverableURI}
              </a>
            </div>
          )}

          {/* ── Agent Actions ─────────────────────────────────────────── */}
          {isConnected && !isEmployer && (
            <div className="card border-arc-500/20">
              <h2 className="text-xs font-semibold text-arc-300 uppercase tracking-wider mb-3">
                Agent Actions
              </h2>
              {job.status === JobStatus.Open && (
                <button onClick={handleApply} disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                  Apply for This Job
                </button>
              )}
              {job.status === JobStatus.Assigned && (
                <button onClick={handleStart} disabled={loading} className="btn-primary w-full">
                  Confirm & Start Working
                </button>
              )}
              {job.status === JobStatus.InProgress && (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="ipfs:// or https:// link to your deliverable"
                    value={deliverableURI}
                    onChange={(e) => setDeliverableURI(e.target.value)}
                    className="input"
                  />
                  <button onClick={handleSubmit} disabled={loading || !deliverableURI} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Submit Deliverable
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Employer Actions ──────────────────────────────────────── */}
          {isConnected && isEmployer && (
            <div className="card border-cyber-500/20">
              <h2 className="text-xs font-semibold text-cyber-300 uppercase tracking-wider mb-3">
                Employer Actions
              </h2>
              {(job.status === JobStatus.Open || job.status === JobStatus.Assigned) && (
                <button onClick={handleCancel} disabled={loading} className="btn-secondary w-full text-red-400 hover:text-red-300 border-red-500/20">
                  Cancel Job &amp; Refund USDC
                </button>
              )}
              {job.status === JobStatus.Submitted && (
                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="label">Satisfaction Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map((r) => (
                        <button
                          key={r}
                          onClick={() => setRating(r)}
                          className={cn(
                            "flex-1 py-2 rounded-lg border text-sm font-bold transition-all",
                            rating === r
                              ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-300"
                              : "bg-surface-3 border-white/10 text-gray-500 hover:text-white"
                          )}
                        >
                          {r}★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Optional feedback comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="input resize-none"
                  />
                  <button onClick={handleApprove} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Approve &amp; Release Payment
                  </button>
                  <div className="space-y-2">
                    <textarea
                      placeholder="Request revision: describe what needs changing…"
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      rows={2}
                      className="input resize-none text-xs"
                    />
                    <button onClick={handleRevision} disabled={loading} className="btn-secondary w-full flex items-center justify-center gap-2 text-xs">
                      <RotateCcw className="h-3.5 w-3.5" /> Request Revision
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Budget & deadline */}
          <div className="card">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Budget
                </span>
                <span className="text-lg font-bold text-cyber-400">{formatUsdc(job.budget)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Deadline
                </span>
                <span className="text-xs font-medium text-yellow-300">{formatDeadline(job.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> Platform Fee
                </span>
                <span className="text-xs text-gray-400">{formatUsdc(job.platformFee)} (2.5%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Agent Earns
                </span>
                <span className="text-xs font-medium text-white">{formatUsdc(job.budget - job.platformFee)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Timeline
            </h3>
            <div className="text-xs text-gray-500 space-y-2">
              <div className="flex justify-between">
                <span>Posted</span>
                <span className="text-gray-300">{timeAgo(job.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Deadline</span>
                <span className="text-yellow-300">{formatDeadline(job.deadline)}</span>
              </div>
              {job.completedAt > 0n && (
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="text-green-300">{timeAgo(job.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Job ID */}
          <div className="card">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Job ID</p>
            <p className="text-[10px] font-mono text-gray-500 break-all">{job.jobId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
