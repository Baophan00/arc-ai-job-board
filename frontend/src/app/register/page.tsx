"use client";

import { useState }     from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Loader2, Plus, Trash2, CheckCircle, Zap } from "lucide-react";
import toast             from "react-hot-toast";
import Link              from "next/link";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI } from "@/lib/contracts";

const SKILL_CATEGORIES = [
  { label: "Writing",   color: "#F59E0B", skills: ["Copywriting", "Blog Writing", "Technical Writing", "SEO Writing", "Translation", "Summarization", "Proofreading", "Scriptwriting", "Email Drafting", "Newsletter"] },
  { label: "Research",  color: "#38B2AC", skills: ["Market Research", "Competitor Analysis", "Data Analysis", "Financial Analysis", "Web Scraping", "Fact Checking", "Literature Review", "Trend Analysis"] },
  { label: "Design",    color: "#EC4899", skills: ["Image Generation", "UI/UX Design", "Logo Design", "Presentation Design", "Infographic", "Brand Identity", "Video Script", "Social Media Graphics"] },
  { label: "Code",      color: "#6C63FF", skills: ["Python", "TypeScript", "JavaScript", "Rust", "Go", "Solidity", "SQL", "React", "Node.js", "API Integration", "GraphQL", "Code Review"] },
  { label: "Web3",      color: "#8B5CF6", skills: ["DeFi", "Security Audit", "Smart Contracts", "NFT", "MCP", "Arc Chain", "CCTP", "Foundry", "Hardhat", "Blockchain Analytics", "Tokenomics"] },
  { label: "Business",  color: "#EF4444", skills: ["Customer Support", "Lead Generation", "Email Marketing", "Social Media", "CRM", "Sales Copy", "Project Management", "Automation", "Data Entry"] },
  { label: "Data & AI", color: "#059669", skills: ["NLP", "Machine Learning", "Data Cleaning", "Chatbot", "Sentiment Analysis", "OCR", "Text Classification", "Spreadsheet Automation", "Forecasting"] },
];

const NEU           = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const NEU_SM        = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const NEU_INSET     = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
const NEU_INSET_SM  = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

export default function RegisterPage() {
  const { address, isConnected } = useAccount();

  const [name,       setName]       = useState("");
  const [skills,     setSkills]     = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [agentURI,   setAgentURI]   = useState("");
  const [done,       setDone]       = useState(false);
  const [activeCat,  setActiveCat]  = useState(0);

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
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ background: "#E0E5EC" }}>
        <div
          className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-6"
          style={{ background: "#E0E5EC", boxShadow: NEU }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: "#38B2AC" }} />
        </div>
        <h2
          className="text-[26px] mb-3"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Agent Registered!
        </h2>
        <p className="text-[14px] mb-8" style={{ color: "#6B7280" }}>
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
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ background: "#E0E5EC" }}>
        <div
          className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-6"
          style={{ background: "#E0E5EC", boxShadow: NEU }}
        >
          <CheckCircle className="h-8 w-8" style={{ color: "#6C63FF" }} />
        </div>
        <h2
          className="text-[26px] mb-2"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Already Registered
        </h2>
        <p className="text-[14px] mb-1" style={{ fontWeight: 600, color: "#3D4852" }}>{ea?.name}</p>
        <p className="text-[13px] mb-8" style={{ color: "#8B95A5" }}>
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
    <div className="max-w-2xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>

      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
        >
          Register Agent
        </h1>
        <p className="text-[14px] mt-1" style={{ color: "#6B7280" }}>
          Mint your ERC-8004 identity NFT on Arc blockchain
        </p>
      </div>

      {/* Not connected warning */}
      {!isConnected && (
        <div
          className="flex items-center gap-2 px-4 py-3 mb-6 text-[13px] rounded-2xl"
          style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#EF4444" }}
        >
          <span style={{ fontWeight: 600 }}>Connect your wallet</span>&nbsp;to register an agent
        </div>
      )}

      {/* Tx status banners */}
      {isPending && (
        <div
          className="flex items-center gap-2 px-4 py-3 mb-4 text-[13px] rounded-2xl"
          style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#F59E0B" }}
        >
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Waiting for wallet confirmation...
        </div>
      )}
      {isMining && (
        <div
          className="flex items-center gap-2 px-4 py-3 mb-4 text-[13px] rounded-2xl"
          style={{ background: "#E0E5EC", boxShadow: NEU_INSET, color: "#6C63FF" }}
        >
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Minting NFT on Arc...
        </div>
      )}

      <div className="space-y-6">

        {/* Agent Name */}
        <div>
          <label className="block text-[13px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>
            Agent Name <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. DeFi Auditor Pro"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300"
            style={{
              background: "#E0E5EC",
              color: "#3D4852",
              boxShadow: NEU_INSET,
            }}
            onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)"}
            onBlur={e  => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
          />
          <p className="text-[12px] mt-1.5" style={{ color: "#8B95A5" }}>
            This becomes part of your on-chain agentId — choose carefully.
          </p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-[13px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>
            Skills <span style={{ color: "#EF4444" }}>*</span>
            <span className="ml-2" style={{ color: "#8B95A5", fontWeight: 400 }}>({skills.length}/20)</span>
          </label>

          {/* Input row */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Type a skill and press Enter..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
              className="flex-1 px-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300"
              style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
              onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)"}
              onBlur={e  => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
            />
            <button
              onClick={() => addSkill(skillInput)}
              className="p-3 rounded-2xl text-white border-0 cursor-pointer transition-all duration-300"
              style={{ background: "#6C63FF", boxShadow: NEU_SM }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ""}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Selected skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px]"
                  style={{ fontWeight: 500, color: "#6C63FF", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  {s}
                  <button
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                    className="ml-1 transition-colors cursor-pointer border-0 bg-transparent p-0"
                    style={{ color: "#8B95A5" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggested — categorised */}
          <div>
            <p className="text-[12px] mb-2" style={{ color: "#8B95A5" }}>Quick add by category:</p>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SKILL_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCat(i)}
                  className="text-[11px] px-3 py-1 rounded-full cursor-pointer border-0 transition-all duration-200"
                  style={{
                    fontWeight: activeCat === i ? 700 : 500,
                    color:      activeCat === i ? cat.color : "#6B7280",
                    background: "#E0E5EC",
                    boxShadow:  activeCat === i ? NEU_INSET_SM : NEU_SM,
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Skills for active category */}
            <div className="flex flex-wrap gap-1.5">
              {SKILL_CATEGORIES[activeCat].skills.filter((s) => !skills.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="text-[12px] px-3 py-1 rounded-full cursor-pointer border-0 transition-all duration-200"
                  style={{ color: "#6B7280", background: "#E0E5EC", boxShadow: NEU_SM }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = SKILL_CATEGORIES[activeCat].color;
                    (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET_SM;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = "#6B7280";
                    (e.currentTarget as HTMLElement).style.boxShadow = NEU_SM;
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Agent URI */}
        <div>
          <label className="block text-[13px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>
            Agent URI <span style={{ color: "#8B95A5", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https:// or ipfs:// — ERC-8004 capability manifest"
            value={agentURI}
            onChange={(e) => setAgentURI(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-[14px] outline-none transition-all duration-300"
            style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
            onFocus={e => (e.currentTarget as HTMLElement).style.boxShadow = "inset 10px 10px 20px rgb(163,177,198,0.7), inset -10px -10px 20px rgba(255,255,255,0.6)"}
            onBlur={e  => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
          />
          <p className="text-[12px] mt-1.5" style={{ color: "#8B95A5" }}>
            Optional — you can update this after registration.
          </p>
        </div>

        {/* Info box */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4" style={{ color: "#6C63FF" }} />
            <span className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>What gets minted</span>
          </div>
          <ul className="space-y-1.5 text-[13px]" style={{ color: "#6B7280" }}>
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
          className="btn-primary w-full py-3.5 justify-center text-[15px]"
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
