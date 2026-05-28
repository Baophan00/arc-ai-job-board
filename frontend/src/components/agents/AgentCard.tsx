import Link from "next/link";
import { cn, shortAddr, timeAgo, reputationLabel } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import type { Agent } from "@/types";

interface Props {
  agent:    Agent;
  featured?: boolean;
  tagline?:  string;
}

const SKILL_COLORS: Record<string, string> = {
  solidity:   "bg-blue-50 text-blue-700 border-blue-200",
  rust:       "bg-orange-50 text-orange-700 border-orange-200",
  python:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  typescript: "bg-sky-50 text-sky-700 border-sky-200",
  javascript: "bg-yellow-50 text-yellow-700 border-yellow-200",
  defi:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  nft:        "bg-purple-50 text-purple-700 border-purple-200",
  ai:         "bg-violet-50 text-violet-700 border-violet-200",
  ml:         "bg-violet-50 text-violet-700 border-violet-200",
};

function getSkillStyle(skill: string): string {
  const key = skill.toLowerCase();
  return SKILL_COLORS[key] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

function reputationBadge(score: number): { label: string; style: string } {
  if (score >= 90) return { label: "Elite",     style: "bg-violet-100 text-violet-700" };
  if (score >= 70) return { label: "Expert",    style: "bg-blue-100 text-blue-700"   };
  if (score >= 50) return { label: "Pro",       style: "bg-emerald-100 text-emerald-700" };
  if (score >= 30) return { label: "Rising",    style: "bg-amber-100 text-amber-700" };
  return              { label: "Newcomer",  style: "bg-gray-100 text-gray-600"   };
}

export function AgentCard({ agent, featured, tagline }: Props) {
  const score   = Number(agent.reputationScore);
  const repBadge = reputationBadge(score);
  const repPct  = Math.min(100, score);

  return (
    <Link
      href={`/agents/${agent.agentId}`}
      className="block bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:no-underline transition-all group"
      style={{ transition: "transform 0.15s ease, border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div className="p-5">
        {/* Header: avatar + name + verified */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 text-white text-[15px] font-700" style={{ fontWeight: 700 }}>
            {agent.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] font-700 text-gray-900 leading-snug truncate group-hover:text-blue-600 transition-colors" style={{ fontWeight: 700 }}>
                {agent.name}
              </span>
              {agent.verified && (
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
              )}
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5">
              {shortAddr(agent.wallet, 5)}
            </div>
          </div>
          {/* Rep badge */}
          <span className={cn("text-[11px] font-600 px-2 py-1 rounded-full shrink-0", repBadge.style)} style={{ fontWeight: 600 }}>
            {repBadge.label}
          </span>
        </div>

        {/* Reputation bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-gray-500">Reputation</span>
            <span className="font-600 text-gray-900" style={{ fontWeight: 600 }}>{score}/100</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${repPct}%` }}
            />
          </div>
        </div>

        {/* Skills */}
        {agent.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {agent.skills.slice(0, 5).map((skill) => (
              <span key={skill} className={cn(
                "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-500 border",
                getSkillStyle(skill)
              )} style={{ fontWeight: 500 }}>
                {skill}
              </span>
            ))}
            {agent.skills.length > 5 && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-500 border bg-gray-50 text-gray-400 border-gray-200" style={{ fontWeight: 500 }}>
                +{agent.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {tagline && (
          <p className="text-[12px] text-gray-500 line-clamp-1 mb-3 italic">
            &ldquo;{tagline}&rdquo;
          </p>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-400">
          <span>
            <span className="text-emerald-600 font-600" style={{ fontWeight: 600 }}>{agent.jobsCompleted.toString()}</span> jobs done
          </span>
          <span>{timeAgo(agent.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
