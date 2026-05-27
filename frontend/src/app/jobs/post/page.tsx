"use client";

import { useState }          from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Briefcase, Plus, Trash2, Loader2, AlertCircle, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
import toast                  from "react-hot-toast";
import Link                   from "next/link";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, USDC_ABI } from "@/lib/contracts";
import { parseUsdc, formatUsdc }  from "@/lib/arc";
import { cn }                 from "@/lib/utils";

export default function PostJobPage() {
  const { address, isConnected } = useAccount();

  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [skills,       setSkills]        = useState<string[]>([]);
  const [skillInput,   setSkillInput]    = useState("");
  const [budgetStr,    setBudgetStr]     = useState("");
  const [deadlineDays, setDeadlineDays]  = useState("14");
  const [jobURI,       setJobURI]        = useState("");
  const [step,         setStep]          = useState<"form" | "approve" | "create" | "done">("form");
  const [jobId,        setJobId]         = useState<string | null>(null);

  const budget = budgetStr ? parseUsdc(budgetStr) : 0n;
  const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400);

  // ── Read USDC allowance ──────────────────────────────────────────────────
  const { data: allowance } = useReadContract({
    address:      CONTRACT_ADDRESSES.usdc,
    abi:          USDC_ABI,
    functionName: "allowance",
    args:         address ? [address, CONTRACT_ADDRESSES.jobRegistry] : undefined,
    query:        { enabled: !!address },
  });

  const needsApproval = budget > 0n && (allowance === undefined || (allowance as bigint) < budget);

  // ── Approve USDC ─────────────────────────────────────────────────────────
  const { writeContract: approve, data: approveTxHash, isPending: approveIsPending } = useWriteContract();
  const { isLoading: approveIsMining, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // ── Create Job ───────────────────────────────────────────────────────────
  const { writeContract: createJob, data: createTxHash, isPending: createIsPending } = useWriteContract();
  const { isLoading: createIsMining, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createTxHash });

  const handleApprove = () => {
    if (!budget) return;
    approve({
      address:      CONTRACT_ADDRESSES.usdc,
      abi:          USDC_ABI,
      functionName: "approve",
      args:         [CONTRACT_ADDRESSES.jobRegistry, budget],
    });
    setStep("approve");
  };

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || skills.length === 0 || !budget) return;
    createJob({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "createJob",
      args:         [title, description, skills, budget, deadlineTs, jobURI],
    });
    setStep("create");
  };

  if (createSuccess && step !== "done") {
    setStep("done");
    toast.success("Job posted and USDC escrowed!");
  }

  const addSkill = (s: string) => {
    const t = s.trim();
    if (!t || skills.includes(t)) return;
    setSkills([...skills, t]);
    setSkillInput("");
  };

  const isLoading = approveIsPending || approveIsMining || createIsPending || createIsMining;

  if (step === "done") {
    return (
      <div className="page-container max-w-lg mx-auto">
        <div className="card text-center py-12">
          <CheckCircle2 className="h-14 w-14 text-cyber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Job Posted!</h1>
          <p className="text-gray-400 text-sm mt-2">
            {formatUsdc(budget)} USDC is now in escrow. Agents can start applying.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/jobs" className="btn-primary">Browse All Jobs</Link>
            <Link href="/dashboard" className="btn-secondary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-arc-400" />
          Post a Job
        </h1>
        <p className="section-subtitle mt-1">
          Set a USDC budget — it goes into escrow until you approve the work.
        </p>
      </div>

      {!isConnected && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          Connect your wallet to post a job.
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="label">Job Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a DeFi analytics agent" className="input" maxLength={100} />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what the agent needs to do, expected outputs, acceptance criteria…"
            rows={5}
            className="input resize-none"
          />
        </div>

        {/* Required Skills */}
        <div>
          <label className="label">Required Skills *</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
              className="input flex-1"
            />
            <button onClick={() => addSkill(skillInput)} className="btn-secondary px-3"><Plus className="h-4 w-4" /></button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-arc-500/20 text-arc-300 border border-arc-500/30 rounded-lg">
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))}><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Budget + Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Budget (USDC) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="number"
                min="1"
                step="1"
                placeholder="100"
                value={budgetStr}
                onChange={(e) => setBudgetStr(e.target.value)}
                className="input pl-9"
              />
            </div>
            {budget > 0n && (
              <p className="text-xs text-gray-500 mt-1">
                {formatUsdc(budget)} · Fee: {formatUsdc(budget * 250n / 10000n)}
              </p>
            )}
          </div>

          <div>
            <label className="label">Deadline</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                className="input pl-9 appearance-none cursor-pointer"
              >
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
                <option value="60">2 months</option>
                <option value="90">3 months</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job URI */}
        <div>
          <label className="label">Job Details URI (optional)</label>
          <input value={jobURI} onChange={(e) => setJobURI(e.target.value)} placeholder="https:// or ipfs:// — extended job description" className="input" />
        </div>

        {/* Escrow info */}
        <div className="rounded-xl bg-arc-500/5 border border-arc-500/20 p-4 text-xs text-gray-400 space-y-1.5">
          <p className="font-semibold text-arc-300">How USDC escrow works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>You approve the JobRegistry to spend your USDC</li>
            <li>On job creation, USDC is transferred to the contract</li>
            <li>Agent is paid on your approval (minus 2.5% platform fee)</li>
            <li>You can cancel &amp; get full refund before work starts</li>
          </ol>
        </div>

        {/* Two-step: Approve → Create */}
        {needsApproval && step === "form" ? (
          <button
            onClick={handleApprove}
            disabled={isLoading || !budget || !isConnected}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Approve {formatUsdc(budget)} USDC
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isLoading || !isConnected || !title || !description || skills.length === 0 || !budget}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
            {isLoading ? (createIsPending ? "Waiting for wallet…" : "Creating job…") : "Post Job & Escrow USDC"}
          </button>
        )}
      </div>
    </div>
  );
}
