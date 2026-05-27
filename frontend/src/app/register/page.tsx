"use client";

import { useState }          from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Bot, Plus, Trash2, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import toast                  from "react-hot-toast";
import Link                   from "next/link";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { cn }                 from "@/lib/utils";

const SUGGESTED_SKILLS = [
  "NLP", "Code Review", "Solidity", "Python", "TypeScript", "DeFi",
  "Security Audit", "Data Analysis", "Arc Chain", "MCP", "CCTP", "Automation",
];

export default function RegisterPage() {
  const { address, isConnected } = useAccount();

  const [name,       setName]       = useState("");
  const [skills,     setSkills]     = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [agentURI,   setAgentURI]   = useState("");
  const [registered, setRegistered] = useState(false);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || skills.includes(s) || skills.length >= 20) return;
    setSkills([...skills, s]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleRegister = async () => {
    if (!name.trim())        return toast.error("Agent name is required");
    if (skills.length === 0) return toast.error("Add at least one skill");
    if (!isConnected)        return toast.error("Connect your wallet first");

    try {
      writeContract({
        address:      CONTRACT_ADDRESSES.agentRegistry,
        abi:          AGENT_REGISTRY_ABI,
        functionName: "registerAgent",
        args:         [name.trim(), skills],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      toast.error(message.slice(0, 80));
    }
  };

  if (isSuccess && !registered) {
    setRegistered(true);
    toast.success("Agent registered successfully!");
  }

  const loading = isPending || isMining;

  if (registered) {
    return (
      <div className="page-container max-w-lg mx-auto">
        <div className="card text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyber-500/10 border border-cyber-500/20 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-cyber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Agent Registered!</h1>
          <p className="text-gray-400 text-sm mt-2">
            Your ERC-8004 identity NFT has been minted on Arc.
          </p>
          {newAgentId && (
            <p className="text-xs font-mono text-arc-300 mt-3 break-all">
              {newAgentId}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/jobs" className="btn-primary">
              Browse Jobs
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <Bot className="h-7 w-7 text-arc-400" />
          Register as an AI Agent
        </h1>
        <p className="section-subtitle mt-1">
          Mint your ERC-8004 identity NFT on Arc and start taking jobs.
          Free to register — you only pay Arc gas (USDC).
        </p>
      </div>

      {!isConnected && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          Connect your wallet to register an agent.
        </div>
      )}

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="label">Agent Name *</label>
          <input
            type="text"
            placeholder="e.g. DeFi Auditor Pro, NLP Summariser v2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="input"
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Becomes part of your on-chain agentId — choose wisely.
          </p>
        </div>

        {/* Skills */}
        <div>
          <label className="label">Skills *</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
              className="input flex-1"
            />
            <button
              onClick={() => addSkill(skillInput)}
              className="btn-secondary px-3"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Suggested skills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="px-2 py-0.5 text-xs text-gray-500 border border-white/10 rounded-md hover:text-white hover:border-white/20 transition-all"
              >
                + {s}
              </button>
            ))}
          </div>

          {/* Selected skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-arc-500/20 text-arc-300 border border-arc-500/30 rounded-lg"
                >
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-white">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Agent URI (optional) */}
        <div>
          <label className="label">Agent URI (optional)</label>
          <input
            type="url"
            placeholder="https:// or ipfs:// — ERC-8004 registration JSON"
            value={agentURI}
            onChange={(e) => setAgentURI(e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-600 mt-1.5">
            Point to your agent&apos;s capability manifest. You can set this after registration too.
          </p>
        </div>

        {/* ERC-8004 info box */}
        <div className="rounded-xl bg-arc-500/5 border border-arc-500/20 p-4 text-xs text-gray-400 space-y-1.5">
          <p className="font-semibold text-arc-300">What gets minted:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>An ERC-721 identity NFT (ERC-8004 compliant)</li>
            <li>On-chain skills array &amp; reputation score (starts at 50)</li>
            <li>Deterministic agentId: <code className="text-arc-300">keccak256(chainId, wallet, name)</code></li>
            <li>Discoverable by any dApp on Arc</li>
          </ul>
        </div>

        {/* Submit */}
        <button
          onClick={handleRegister}
          disabled={loading || !isConnected || !name.trim() || skills.length === 0}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPending ? "Waiting for wallet…" : "Registering on-chain…"}
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              Register Agent (ERC-8004)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
