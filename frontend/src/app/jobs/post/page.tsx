"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Plus, Trash2, Loader2, Send, Shield, CheckCircle } from "lucide-react";
import toast             from "react-hot-toast";
import Link              from "next/link";
import { CONTRACT_ADDRESSES, JOB_REGISTRY_ABI, USDC_ABI } from "@/lib/contracts";
import { parseUsdc, formatUsdc }  from "@/lib/arc";
import { shortAddr }     from "@/lib/utils";

const SUGGESTED_SKILLS = [
  "Solidity", "Python", "TypeScript", "NLP", "DeFi", "Security Audit",
  "Data Analysis", "Smart Contracts", "Rust", "Go", "GraphQL", "Automation",
];

export default function PostJobPage() {
  const { address, isConnected } = useAccount();

  const [title,        setTitle]       = useState("");
  const [description,  setDescription] = useState("");
  const [skills,       setSkills]      = useState<string[]>([]);
  const [skillInput,   setSkillInput]  = useState("");
  const [budgetStr,    setBudgetStr]   = useState("");
  const [deadlineDays, setDeadlineDays] = useState("14");
  const [jobURI,       setJobURI]      = useState("");
  const [done,         setDone]        = useState(false);

  const budget     = budgetStr ? parseUsdc(budgetStr) : 0n;
  const deadlineTs = BigInt(Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400);

  // ── Read USDC allowance ──────────────────────────────────────────────────
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address:      CONTRACT_ADDRESSES.usdc,
    abi:          USDC_ABI,
    functionName: "allowance",
    args:         address ? [address, CONTRACT_ADDRESSES.jobRegistry] : undefined,
    query:        { enabled: !!address },
  });

  const needsApproval = budget > 0n && (allowance === undefined || (allowance as bigint) < budget);

  // ── Step 1: Approve USDC ─────────────────────────────────────────────────
  const {
    writeContract: approveWrite,
    data:          approveTxHash,
    isPending:     approveIsPending,
    isError:       approveIsError,
    error:         approveErr,
  } = useWriteContract();

  const { isLoading: approveIsMining, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // ── Step 2: Create Job ───────────────────────────────────────────────────
  const {
    writeContract: createWrite,
    data:          createTxHash,
    isPending:     createIsPending,
    isError:       createIsError,
    error:         createErr,
  } = useWriteContract();

  const { isLoading: createIsMining, isSuccess: createSuccess } =
    useWaitForTransactionReceipt({ hash: createTxHash });

  // ── Watch approve result ─────────────────────────────────────────────────
  useEffect(() => {
    if (!approveSuccess) return;
    toast.success("USDC approved — now post the job!");
    refetchAllowance();
  }, [approveSuccess]); // eslint-disable-line

  // ── Watch create result ──────────────────────────────────────────────────
  useEffect(() => {
    if (!createSuccess) return;
    toast.success("Job posted · USDC in escrow ✓");
    setDone(true);
  }, [createSuccess]); // eslint-disable-line

  // ── Watch errors ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!approveIsError || !approveErr) return;
    const msg = approveErr.message ?? "";
    if (msg.includes("User rejected") || msg.includes("user rejected"))
      toast.error("Approval cancelled");
    else
      toast.error(msg.slice(0, 80));
  }, [approveIsError]); // eslint-disable-line

  useEffect(() => {
    if (!createIsError || !createErr) return;
    const msg = createErr.message ?? "";
    if (msg.includes("User rejected") || msg.includes("user rejected"))
      toast.error("Transaction cancelled");
    else
      toast.error(msg.slice(0, 80));
  }, [createIsError]); // eslint-disable-line

  const addSkill = (s: string) => {
    const t = s.trim();
    if (!t || skills.includes(t) || skills.length >= 20) return;
    setSkills([...skills, t]);
    setSkillInput("");
  };

  const handleApprove = () => {
    if (!budget || !isConnected) return;
    approveWrite({
      address:      CONTRACT_ADDRESSES.usdc,
      abi:          USDC_ABI,
      functionName: "approve",
      args:         [CONTRACT_ADDRESSES.jobRegistry, budget],
    });
  };

  const handleCreate = () => {
    if (!title.trim() || !description.trim() || skills.length === 0 || !budget) return;
    createWrite({
      address:      CONTRACT_ADDRESSES.jobRegistry,
      abi:          JOB_REGISTRY_ABI,
      functionName: "createJob",
      args:         [title, description, skills, budget, deadlineTs, jobURI],
    });
  };

  const approveLoading = approveIsPending || approveIsMining;
  const createLoading  = createIsPending  || createIsMining;
  const anyLoading     = approveLoading || createLoading;

  // ── Done state ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-[24px] font-800 text-gray-900 mb-2" style={{ fontWeight: 800 }}>
          Job Posted!
        </h2>
        <p className="text-[14px] text-gray-500 mb-6">
          Your job is now on-chain and USDC is locked in escrow.<br />
          Agents can now apply for this job.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/jobs" className="btn-primary justify-center">Browse Jobs →</Link>
          <Link href="/dashboard" className="btn-secondary justify-center">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const platformFee = budget > 0n ? (budget * 250n) / 10000n : 0n;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-800 text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
          Post a Job
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          USDC is locked in escrow until you approve the deliverable
        </p>
      </div>

      {/* Not connected */}
      {!isConnected && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-[13px] text-red-700">
          <span className="font-600" style={{ fontWeight: 600 }}>Connect your wallet</span> to post a job
        </div>
      )}

      {/* Transaction status bars */}
      {approveIsPending && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Waiting for wallet to approve USDC...
        </div>
      )}
      {approveIsMining && approveTxHash && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Confirming USDC approval...{" "}
          <a href={`https://testnet.arcscan.app/tx/${approveTxHash}`} target="_blank" rel="noopener noreferrer" className="underline">
            {shortAddr(approveTxHash, 8)} ↗
          </a>
        </div>
      )}
      {approveSuccess && !createTxHash && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          USDC approved ✓ — now click &ldquo;Post Job&rdquo; below
        </div>
      )}
      {createIsPending && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Waiting for wallet to create job...
        </div>
      )}
      {createIsMining && createTxHash && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Posting job on-chain...{" "}
          <a href={`https://testnet.arcscan.app/tx/${createTxHash}`} target="_blank" rel="noopener noreferrer" className="underline">
            {shortAddr(createTxHash, 8)} ↗
          </a>
        </div>
      )}

      <div className="space-y-5">

        {/* Title */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Smart Contract Security Audit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describe what needs to be done, deliverables, acceptance criteria..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Required Skills <span className="text-red-500">*</span>
            <span className="text-gray-400 font-400 ml-2" style={{ fontWeight: 400 }}>({skills.length}/20)</span>
          </label>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Type a skill and press Enter..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
              className="flex-1 px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <button
              onClick={() => addSkill(skillInput)}
              className="p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[12px] font-500" style={{ fontWeight: 500 }}>
                  {s}
                  <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="ml-1 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <p className="text-[12px] text-gray-400 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="text-[12px] text-gray-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 px-3 py-1 rounded-full transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget + Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              Budget (USDC) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-600" style={{ fontWeight: 600 }}>$</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="50"
                value={budgetStr}
                onChange={(e) => setBudgetStr(e.target.value)}
                className="w-full pl-7 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            {budget > 0n && (
              <div className="mt-2 text-[12px] text-gray-500 space-y-0.5">
                <div>Platform fee: {formatUsdc(platformFee)} USDC (2.5%)</div>
                <div className="text-emerald-600 font-500" style={{ fontWeight: 500 }}>
                  Agent earns: {formatUsdc(budget - platformFee)} USDC
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
              Deadline
            </label>
            <select
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-700 outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-all"
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

        {/* Job URI */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Job URI <span className="text-gray-400 font-400" style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https:// or ipfs:// — extended job brief"
            value={jobURI}
            onChange={(e) => setJobURI(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-[13px] font-600 text-blue-700" style={{ fontWeight: 600 }}>How escrow works</span>
          </div>
          <ul className="space-y-1 text-[13px] text-blue-700">
            <li>· Step 1 — Approve USDC spend (wallet signature #1)</li>
            <li>· Step 2 — Create job + lock USDC in contract (wallet signature #2)</li>
            <li>· Agent is paid when you approve their deliverable</li>
            <li>· Cancel anytime before work starts → full USDC refund</li>
          </ul>
        </div>

        {/* Two-step CTA */}
        {needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={anyLoading || !budget || !isConnected || !title.trim() || skills.length === 0}
            className="btn-primary w-full py-3 justify-center text-[15px]"
          >
            {approveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {approveIsPending ? "Waiting for wallet..." : "Confirming approval..."}
              </>
            ) : (
              `Step 1 · Approve ${budgetStr ? formatUsdc(budget) : "?"} USDC`
            )}
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={anyLoading || !isConnected || !title.trim() || !description.trim() || skills.length === 0 || !budget}
            className="btn-primary w-full py-3 justify-center text-[15px]"
          >
            {createLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {createIsPending ? "Waiting for wallet..." : "Posting job on-chain..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {approveSuccess ? "Step 2 · Post Job & Escrow USDC" : "Post Job & Escrow USDC"}
              </>
            )}
          </button>
        )}

        {budget > 0n && (
          <p className="text-center text-[12px] text-gray-400">
            {needsApproval ? "Requires 2 wallet signatures" : "USDC already approved · 1 signature needed"}
          </p>
        )}
      </div>
    </div>
  );
}
