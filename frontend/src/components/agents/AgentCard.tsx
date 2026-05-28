import Link from "next/link";
import { shortAddr, timeAgo } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import type { Agent } from "@/types";

interface Props {
  agent:    Agent;
  featured?: boolean;
  tagline?:  string;
}

const SKILL_COLORS: Record<string, string> = {
  solidity:   "#3B82F6",
  rust:       "#EA580C",
  python:     "#CA8A04",
  typescript: "#0284C7",
  defi:       "#38B2AC",
  nft:        "#9333EA",
  ai:         "#6C63FF",
  ml:         "#6C63FF",
};

function getSkillColor(skill: string): string {
  return SKILL_COLORS[skill.toLowerCase()] ?? "#6B7280";
}

function reputationBadge(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Elite",    color: "#6C63FF" };
  if (score >= 70) return { label: "Expert",   color: "#3B82F6" };
  if (score >= 50) return { label: "Pro",      color: "#38B2AC" };
  if (score >= 30) return { label: "Rising",   color: "#F59E0B" };
  return              { label: "Newcomer", color: "#8B95A5" };
}

const neuShadow      = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const neuShadowHover = "12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)";
const neuShadowSm    = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const neuInsetSm     = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";
const neuInset       = "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)";

export function AgentCard({ agent, tagline }: Props) {
  const score    = Number(agent.reputationScore);
  const repBadge = reputationBadge(score);
  const repPct   = Math.min(100, score);

  return (
    <Link
      href={`/agents/${agent.agentId}`}
      className="block rounded-[32px] hover:no-underline"
      style={{ background: "#E0E5EC", boxShadow: neuShadow, transition: "transform 0.3s ease-out, box-shadow 0.3s ease-out" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = neuShadowHover;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = neuShadow;
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <div className="p-6">
        {/* Header: avatar + name + verified */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white text-[16px]"
            style={{
              fontFamily: "var(--font-plus-jakarta)",
              fontWeight: 800,
              background: "#6C63FF",
              boxShadow: "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)",
            }}
          >
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[14px] leading-snug truncate"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
              >
                {agent.name}
              </span>
              {agent.verified && (
                <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "#38B2AC" }} />
              )}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: "#8B95A5" }}>
              {shortAddr(agent.wallet, 5)}
            </div>
          </div>
          {/* Rep badge */}
          <span
            className="text-[11px] px-2.5 py-1 rounded-full shrink-0"
            style={{ fontWeight: 600, color: repBadge.color, background: "#E0E5EC", boxShadow: neuInsetSm }}
          >
            {repBadge.label}
          </span>
        </div>

        {/* Reputation bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[12px] mb-2">
            <span style={{ color: "#6B7280" }}>Reputation</span>
            <span style={{ color: "#3D4852", fontWeight: 600 }}>{score}/100</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "#E0E5EC", boxShadow: neuInset }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${repPct}%`, background: "#6C63FF" }}
            />
          </div>
        </div>

        {/* Skills */}
        {agent.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {agent.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px]"
                style={{ fontWeight: 500, color: getSkillColor(skill), background: "#E0E5EC", boxShadow: neuShadowSm }}
              >
                {skill}
              </span>
            ))}
            {agent.skills.length > 5 && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px]"
                style={{ fontWeight: 500, color: "#8B95A5", background: "#E0E5EC", boxShadow: neuInsetSm }}
              >
                +{agent.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {tagline && (
          <p className="text-[12px] line-clamp-1 mb-3 italic" style={{ color: "#6B7280" }}>
            &ldquo;{tagline}&rdquo;
          </p>
        )}

        {/* Footer */}
        <div
          className="pt-4 flex items-center justify-between text-[12px]"
          style={{ borderTop: "1px solid rgba(163,177,198,0.35)", color: "#8B95A5" }}
        >
          <span>
            <span style={{ color: "#38B2AC", fontWeight: 600 }}>{agent.jobsCompleted.toString()}</span> jobs done
          </span>
          <span>{timeAgo(agent.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
