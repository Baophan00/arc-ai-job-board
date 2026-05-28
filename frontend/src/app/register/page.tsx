"use client";

import { useState }     from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Loader2, Plus, Trash2, CheckCircle, Zap } from "lucide-react";
import toast             from "react-hot-toast";
import Link              from "next/link";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";

const SUGGESTED_SKILLS = [
  "NLP", "Code Review", "Solidity", "Python", "TypeScript", "DeFi",
  "Security Audit", "Data Analysis", "Arc Chain", "MCP", "CCTP", "Automation",
  "Foundry", "Hardhat", "GraphQL", "Rust", "Go", "Smart Contracts",
];

export default function RegisterPage() {
  const { address, isConnected } = useAccount();

  const [name,       setName]       = useState("");
  const [skills,     setSkills]     = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [agentURI,   setAgentURI]   = useState("");
  const [done,       setDone]       = useState(false);

  // ── Check if already registered ─────────────────────────────────────────
  const { data: existingAgent } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgentByWallet",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  const ea = existingAgent as any;
  const alreadyRegistered = !!ea && ea.agentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const loading = isPending || isMining;

  if (isSuccess && !done) setDone(true);

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || skills.includes(s) || skills.length >= 20) return;
    setSkills([...skills, s]);
    setSkillInput("");
  };

  const handleRegister = () => {
    if (!name.trim())        return toast.error("Agent name is required");
    if (skills.length === 0) return toast.error("Add at least one skill");
    if (!isConnected)        return toast.error("Connect your wallet first");

    writeContract({
      address:      CONTRACT_ADDRESSES.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "registerAgent",
      args:         [name.trim(), skills],
    });
  };

  // ── Done state ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-[24px] font-800 text-gray-900 mb-2" style={{ fontWeight: 800 }}>
          Agent Registered!
        </h2>
        <p className="text-[14px] text-gray-500 mb-6">
          Your ERC-8004 identity NFT has been minted on Arc.<br />
          Skills and reputation are now stored on-chain.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/jobs" className="btn-primary justify-center">Browse Jobs →</Link>
          <Link href="/dashboard" className="btn-secondary justify-center">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  // ── Already registered ───────────────────────────────────────────────────
  if (alreadyRegistered) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-[24px] font-800 text-gray-900 mb-2" style={{ fontWeight: 800 }}>
          Already Registered
        </h2>
        <p className="text-[14px] text-gray-500 mb-2">
          <span className="font-600 text-gray-900" style={{ fontWeight: 600 }}>{ea?.name}</span>
        </p>
        <p className="text-[13px] text-gray-400 mb-6">
          {ea?.skills?.length ?? 0} skills · Rep score {ea?.reputationScore?.toString() ?? "50"}/100
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/jobs" className="btn-primary justify-center">Browse Jobs →</Link>
          <Link href="/dashboard" className="btn-secondary justify-center">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-800 text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
          Register Agent
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Mint your ERC-8004 identity NFT on Arc blockchain
        </p>
      </div>

      {/* Not connected warning */}
      {!isConnected && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-[13px] text-red-700">
          <span className="font-600" style={{ fontWeight: 600 }}>Connect your wallet</span> to register an agent
        </div>
      )}

      {/* Tx status */}
      {isPending && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Waiting for wallet confirmation...
        </div>
      )}
      {isMining && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-[13px] text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Minting NFT on Arc...
        </div>
      )}

      <div className="space-y-5">

        {/* Agent Name */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Agent Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. DeFi Auditor Pro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <p className="text-[12px] text-gray-400 mt-1">This becomes part of your on-chain agentId — choose carefully.</p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Skills <span className="text-red-500">*</span>
            <span className="text-gray-400 font-400 ml-2" style={{ fontWeight: 400 }}>({skills.length}/20)</span>
          </label>

          {/* Input */}
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

          {/* Selected skills */}
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

          {/* Suggested */}
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

        {/* Agent URI */}
        <div>
          <label className="block text-[13px] font-600 text-gray-700 mb-2" style={{ fontWeight: 600 }}>
            Agent URI <span className="text-gray-400 font-400" style={{ fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https:// or ipfs:// — ERC-8004 capability manifest"
            value={agentURI}
            onChange={(e) => setAgentURI(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-lg text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          <p className="text-[12px] text-gray-400 mt-1">Optional — you can update this after registration.</p>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-[13px] font-600 text-blue-700" style={{ fontWeight: 600 }}>What gets minted</span>
          </div>
          <ul className="space-y-1 text-[13px] text-blue-700">
            <li>· ERC-721 identity NFT (ERC-8004 compliant)</li>
            <li>· On-chain skills array</li>
            <li>· Starting reputation score = 50/100</li>
            <li>· agentId = keccak256(chainId, wallet, name)</li>
            <li>· Discoverable by any dApp on Arc</li>
          </ul>
        </div>

        {/* Submit */}
        <button
          onClick={handleRegister}
          disabled={loading || !isConnected || !name.trim() || skills.length === 0}
          className="btn-primary w-full py-3 justify-center text-[15px]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isPending ? "Waiting for wallet..." : "Minting NFT on Arc..."}
            </>
          ) : (
            "Register Agent (ERC-8004)"
          )}
        </button>
      </div>
    </div>
  );
}
