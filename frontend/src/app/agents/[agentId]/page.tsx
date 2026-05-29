"use client";

import { useState }       from "react";
import { useParams }      from "next/navigation";
import Link               from "next/link";
import { ExternalLink, ArrowLeft, CheckCircle, Star, Award, Briefcase, Pencil, Loader2, X } from "lucide-react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import toast              from "react-hot-toast";
import { CONTRACT_ADDRESSES, AGENT_REGISTRY_ABI, JOB_REGISTRY_ABI } from "@/lib/contracts";
import { shortAddr, timeAgo, reputationLabel } from "@/lib/utils";
import { ARC_EXPLORER_URL } from "@/lib/arc";
import type { Agent }     from "@/types";

const NEU           = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const NEU_SM        = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const NEU_INSET     = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";
const NEU_INSET_SM  = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

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

function reputationBadge(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Elite",    color: "#6C63FF" };
  if (score >= 70) return { label: "Expert",   color: "#3B82F6" };
  if (score >= 50) return { label: "Pro",      color: "#38B2AC" };
  if (score >= 30) return { label: "Rising",   color: "#F59E0B" };
  return             { label: "Newcomer", color: "#6B7280" };
}

export default function AgentProfilePage() {
  const params  = useParams<{ agentId: string }>();
  const agentId = params.agentId as `0x${string}`;

  const { address } = useAccount();

  // ── Edit URI state ───────────────────────────────────────────────────────
  const [editingURI, setEditingURI] = useState(false);
  const [newURI,     setNewURI]     = useState("");

  const { writeContract: writeUri,    data: uriHash,    isPending: uriPending    } = useWriteContract();
  const { writeContract: writeSkills, data: skillsHash, isPending: skillsPending } = useWriteContract();

  const { isLoading: uriMining,    isSuccess: uriSuccess    } = useWaitForTransactionReceipt({ hash: uriHash    });
  const { isLoading: skillsMining, isSuccess: skillsSuccess } = useWaitForTransactionReceipt({ hash: skillsHash });

  const savingUri    = uriPending    || uriMining;
  const savingSkills = skillsPending || skillsMining;

  // ── Edit skills state ────────────────────────────────────────────────────
  const [editingSkills, setEditingSkills] = useState(false);
  const [editSkillsList, setEditSkillsList] = useState<string[]>([]);
  const [skillInput,    setSkillInput]    = useState("");

  if (uriSuccess && editingURI) {
    toast.success("Agent URI updated!");
    setEditingURI(false);
    setNewURI("");
  }

  if (skillsSuccess && editingSkills) {
    toast.success("Skills updated!");
    setEditingSkills(false);
    setSkillInput("");
  }

  const handleSaveURI = () => {
    if (!newURI.trim()) return toast.error("URI cannot be empty");
    writeUri({
      address:      CONTRACT_ADDRESSES.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "setAgentURI",
      args:         [agentId, newURI.trim()],
    });
  };

  const handleSaveSkills = () => {
    if (editSkillsList.length === 0) return toast.error("Add at least one skill");
    writeSkills({
      address:      CONTRACT_ADDRESSES.agentRegistry,
      abi:          AGENT_REGISTRY_ABI,
      functionName: "updateSkills",
      args:         [agentId, editSkillsList],
    });
  };

  const addEditSkill = (s: string) => {
    const trimmed = s.trim();
    if (!trimmed || editSkillsList.includes(trimmed) || editSkillsList.length >= 20) return;
    setEditSkillsList([...editSkillsList, trimmed]);
    setSkillInput("");
  };

  const { data: agentRaw, isLoading } = useReadContract({
    address:      CONTRACT_ADDRESSES.agentRegistry,
    abi:          AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args:         [agentId],
  });

  const { data: agentJobIds } = useReadContract({
    address:      CONTRACT_ADDRESSES.jobRegistry,
    abi:          JOB_REGISTRY_ABI,
    functionName: "getAgentJobs",
    args:         [agentId],
    query:        { enabled: !!agentRaw },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-[13px] mb-6 hover:no-underline transition-colors"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[14px] animate-pulse" style={{ color: "#6B7280" }}>Loading agent profile...</div>
        </div>
      </div>
    );
  }

  if (!agentRaw) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-[13px] mb-6 hover:no-underline transition-colors"
          style={{ color: "#6B7280" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Agents
        </Link>
        <div className="rounded-[32px] py-16 text-center" style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}>
          <div className="text-[16px] mb-2" style={{ fontWeight: 600, color: "#3D4852" }}>Agent not found</div>
          <div className="text-[12px] font-mono" style={{ color: "#8B95A5" }}>{agentId}</div>
        </div>
      </div>
    );
  }

  const agent    = agentRaw as unknown as Agent;
  const score    = Number(agent.reputationScore ?? 0n);
  const jobIds   = (agentJobIds as `0x${string}`[] | undefined) ?? [];
  const repBadge = reputationBadge(score);
  const isOwner  = !!address && address.toLowerCase() === agent.wallet?.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" style={{ background: "#E0E5EC" }}>
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-[13px] mb-6 hover:no-underline transition-colors"
        style={{ color: "#6B7280" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Profile sidebar ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-5">
          <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            {/* Avatar + name */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white text-[22px]"
                style={{ fontWeight: 800, background: "#6C63FF", boxShadow: NEU_SM }}
              >
                {agent.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1
                    className="text-[17px] leading-tight"
                    style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
                  >
                    {agent.name}
                  </h1>
                  {agent.verified && (
                    <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#38B2AC" }} />
                  )}
                </div>
                <div className="text-[12px] mt-0.5 font-mono" style={{ color: "#8B95A5" }}>
                  {shortAddr(agent.wallet, 6)}
                </div>
                <span
                  className="inline-block text-[11px] px-2.5 py-0.5 rounded-full mt-1.5"
                  style={{ fontWeight: 600, color: repBadge.color, background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  {repBadge.label}
                </span>
              </div>
            </div>

            {/* Rep bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[13px] mb-2">
                <span style={{ color: "#6B7280" }}>Reputation</span>
                <span style={{ fontWeight: 700, color: "#6C63FF" }}>{score}/100</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, score)}%`, background: "#6C63FF" }}
                />
              </div>
              <div className="text-[12px] mt-1.5" style={{ color: "#8B95A5" }}>{reputationLabel(score)}</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div
                className="rounded-2xl p-3 text-center"
                style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
              >
                <div
                  className="text-[22px]"
                  style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#38B2AC" }}
                >
                  {agent.jobsCompleted?.toString() ?? "0"}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>Jobs Done</div>
              </div>
              <div
                className="rounded-2xl p-3 text-center"
                style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
              >
                <div
                  className="text-[22px]"
                  style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#6C63FF" }}
                >
                  {agent.skills?.length ?? 0}
                </div>
                <div className="text-[11px]" style={{ color: "#6B7280" }}>Skills</div>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px]" style={{ color: "#8B95A5" }}>Skills</span>
                {isOwner && !editingSkills && (
                  <button
                    onClick={() => { setEditingSkills(true); setEditSkillsList([...(agent.skills ?? [])]); }}
                    className="flex items-center gap-1 text-[11px] cursor-pointer border-0 bg-transparent p-0 transition-colors"
                    style={{ color: "#8B95A5" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>

              {!editingSkills ? (
                <div className="flex flex-wrap gap-1.5">
                  {(agent.skills ?? []).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-full text-[11px]"
                      style={{ fontWeight: 500, color: getSkillColor(s), background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Current edit list */}
                  <div className="flex flex-wrap gap-1.5">
                    {editSkillsList.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px]"
                        style={{ fontWeight: 500, color: "#6C63FF", background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                      >
                        {s}
                        <button
                          onClick={() => setEditSkillsList(editSkillsList.filter(x => x !== s))}
                          className="cursor-pointer border-0 bg-transparent p-0 ml-0.5"
                          style={{ color: "#8B95A5", lineHeight: 1 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Add skill input */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add skill…"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEditSkill(skillInput); } }}
                      className="flex-1 px-3 py-1.5 rounded-xl text-[12px] outline-none"
                      style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
                    />
                    <button
                      onClick={() => addEditSkill(skillInput)}
                      className="px-2.5 py-1.5 rounded-xl text-white text-[12px] border-0 cursor-pointer"
                      style={{ background: "#6C63FF", boxShadow: NEU_SM }}
                    >
                      +
                    </button>
                  </div>
                  {/* Save / Cancel */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleSaveSkills}
                      disabled={savingSkills}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[12px] text-white border-0 cursor-pointer"
                      style={{ fontWeight: 600, background: "#6C63FF", boxShadow: NEU_SM, opacity: savingSkills ? 0.7 : 1 }}
                    >
                      {savingSkills ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {skillsPending ? "Confirm…" : skillsMining ? "Saving…" : "Save Skills"}
                    </button>
                    <button
                      onClick={() => { setEditingSkills(false); setSkillInput(""); }}
                      disabled={savingSkills}
                      className="p-1.5 rounded-xl border-0 cursor-pointer"
                      style={{ background: "#E0E5EC", boxShadow: NEU_SM, color: "#6B7280" }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Links */}
            <div
              className="space-y-2.5 pt-4"
              style={{ borderTop: "1px solid rgba(163,177,198,0.35)" }}
            >
              <a
                href={`${ARC_EXPLORER_URL}/address/${agent.wallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[13px] hover:no-underline transition-colors"
                style={{ color: "#6C63FF" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              >
                <ExternalLink className="h-4 w-4" /> View on ArcScan
              </a>
              {agent.agentURI && (
                <a
                  href={agent.agentURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] hover:no-underline transition-colors"
                  style={{ color: "#6C63FF" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                >
                  <ExternalLink className="h-4 w-4" /> ERC-8004 Manifest
                </a>
              )}
            </div>

            <div className="mt-3 text-[12px]" style={{ color: "#8B95A5" }}>
              Registered {timeAgo(agent.createdAt)}
            </div>

            {/* ── Edit Agent URI (owner only) ───────────────────────────── */}
            {isOwner && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid rgba(163,177,198,0.35)" }}
              >
                {!editingURI ? (
                  <button
                    onClick={() => { setEditingURI(true); setNewURI(agent.agentURI ?? ""); }}
                    className="flex items-center gap-2 text-[13px] cursor-pointer border-0 bg-transparent p-0 transition-colors"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit Agent URI
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[12px]" style={{ fontWeight: 600, color: "#3D4852" }}>Agent URI</div>
                    <input
                      type="url"
                      placeholder="https:// or ipfs://"
                      value={newURI}
                      onChange={e => setNewURI(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-[12px] outline-none"
                      style={{ background: "#E0E5EC", color: "#3D4852", boxShadow: NEU_INSET }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveURI}
                        disabled={savingUri}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] text-white border-0 cursor-pointer transition-all"
                        style={{ fontWeight: 600, background: "#6C63FF", boxShadow: NEU_SM, opacity: savingUri ? 0.7 : 1 }}
                      >
                        {savingUri ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {uriPending ? "Confirm..." : uriMining ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingURI(false); setNewURI(""); }}
                        disabled={savingUri}
                        className="p-2 rounded-xl border-0 cursor-pointer transition-all"
                        style={{ background: "#E0E5EC", boxShadow: NEU_SM, color: "#6B7280" }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Identity */}
          <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <h2
              className="text-[14px] mb-4"
              style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
            >
              ERC-8004 Identity
            </h2>
            <div
              className="space-y-2.5 text-[12px] font-mono p-4 rounded-2xl"
              style={{ background: "#E0E5EC", boxShadow: NEU_INSET }}
            >
              <div>
                <span style={{ color: "#8B95A5" }}>agentId: </span>
                <span className="break-all" style={{ color: "#3D4852" }}>{agent.agentId}</span>
              </div>
              <div>
                <span style={{ color: "#8B95A5" }}>wallet: </span>
                <span className="break-all" style={{ color: "#3D4852" }}>{agent.wallet}</span>
              </div>
              {agent.agentURI && (
                <div>
                  <span style={{ color: "#8B95A5" }}>agentURI: </span>
                  <a
                    href={agent.agentURI}
                    className="break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#6C63FF" }}
                  >
                    {agent.agentURI}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-[32px] p-5" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <h2
              className="text-[14px] mb-4"
              style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
            >
              Badges
            </h2>
            <div className="space-y-2.5">
              {agent.verified && (
                <div
                  className="flex items-center gap-2.5 p-3 rounded-2xl"
                  style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#38B2AC" }} />
                  <div>
                    <div className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>Platform Verified</div>
                    <div className="text-[12px]" style={{ color: "#6B7280" }}>Identity confirmed by Arc platform</div>
                  </div>
                </div>
              )}
              {Number(agent.jobsCompleted ?? 0) >= 10 && (
                <div
                  className="flex items-center gap-2.5 p-3 rounded-2xl"
                  style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  <Briefcase className="h-5 w-5 shrink-0" style={{ color: "#38B2AC" }} />
                  <div>
                    <div className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>10+ Jobs Completed</div>
                    <div className="text-[12px]" style={{ color: "#6B7280" }}>Experienced on-chain contractor</div>
                  </div>
                </div>
              )}
              {score >= 80 && (
                <div
                  className="flex items-center gap-2.5 p-3 rounded-2xl"
                  style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  <Star className="h-5 w-5 shrink-0" style={{ color: "#F59E0B" }} />
                  <div>
                    <div className="text-[13px]" style={{ fontWeight: 600, color: "#3D4852" }}>Top Rated Agent</div>
                    <div className="text-[12px]" style={{ color: "#6B7280" }}>Reputation score ≥ 80</div>
                  </div>
                </div>
              )}
              {!agent.verified && Number(agent.jobsCompleted ?? 0) < 10 && score < 80 && (
                <div
                  className="flex items-center gap-2.5 p-3 rounded-2xl"
                  style={{ background: "#E0E5EC", boxShadow: NEU_INSET_SM }}
                >
                  <Award className="h-5 w-5 shrink-0" style={{ color: "#8B95A5" }} />
                  <div>
                    <div className="text-[13px]" style={{ color: "#6B7280" }}>No badges yet</div>
                    <div className="text-[12px]" style={{ color: "#8B95A5" }}>Complete jobs to earn badges</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job history */}
          <div className="rounded-[32px] overflow-hidden" style={{ background: "#E0E5EC", boxShadow: NEU }}>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(163,177,198,0.35)" }}
            >
              <h2
                className="text-[13px]"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                Job History
              </h2>
              <span className="text-[12px]" style={{ color: "#6B7280" }}>{jobIds.length} jobs</span>
            </div>
            <div className="p-4">
              {jobIds.length === 0 ? (
                <div className="text-[13px] text-center py-6" style={{ color: "#8B95A5" }}>
                  No jobs completed yet
                </div>
              ) : (
                <div className="space-y-2">
                  {jobIds.slice(0, 10).map((id) => (
                    <Link
                      key={id}
                      href={`/jobs/${id}`}
                      className="flex items-center justify-between p-3 rounded-2xl transition-all duration-200 hover:no-underline group"
                      style={{ background: "#E0E5EC", boxShadow: NEU_SM }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_INSET}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = NEU_SM}
                    >
                      <span className="text-[12px] font-mono transition-colors" style={{ color: "#6B7280" }}>
                        {shortAddr(id, 10)}
                      </span>
                      <span className="text-[12px] transition-colors" style={{ color: "#8B95A5" }}>→</span>
                    </Link>
                  ))}
                  {jobIds.length > 10 && (
                    <div className="text-[12px] text-center pt-2" style={{ color: "#8B95A5" }}>
                      +{jobIds.length - 10} more jobs
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
