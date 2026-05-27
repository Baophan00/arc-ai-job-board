import Link from "next/link";
import { cn, shortAddr, timeAgo, reputationColor, reputationLabel, skillColor, termBar } from "@/lib/utils";
import type { Agent } from "@/types";

interface Props {
  agent:    Agent;
  featured?: boolean;
  tagline?:  string;
}

export function AgentCard({ agent, featured, tagline }: Props) {
  const score       = Number(agent.reputationScore);
  const label       = reputationLabel(score);
  const processName = agent.name.toUpperCase().replace(/\s+/g, "_");

  return (
    <Link
      href={`/agents/${agent.agentId}`}
      className="block term-card group hover:no-underline font-mono"
    >
      {/* Title bar */}
      <div className="term-card-header">
        <span className="truncate text-[9px]">// AGENT: {processName}</span>
        <span className={cn(
          "shrink-0 ml-2 text-[9px] font-bold",
          agent.verified ? "text-[#0a0a0a]" : "text-[#0a0a0a]/60"
        )}>
          {agent.verified ? "[✓VFD]" : "[UNVFD]"}
        </span>
      </div>

      <div className="term-card-body space-y-2">
        {/* Address */}
        <div className="text-[10px] text-[#1f521f]">
          addr: <span className="text-[#33ff00]">{shortAddr(agent.wallet, 5)}</span>
        </div>

        {/* Reputation bar */}
        <div>
          <div className="text-[9px] text-[#1f521f] mb-0.5">rep_score:</div>
          <div className={cn("text-[11px] font-bold leading-tight tracking-tight flex items-center gap-1 flex-wrap", reputationColor(score))}>
            <span className="text-[10px]">{termBar(score, 100, 14)}</span>
            <span>{score}</span>
            <span className="text-[#1f521f]">/100</span>
            <span className="text-[9px] text-[#1f521f]">[{label}]</span>
          </div>
        </div>

        {/* Skills */}
        {agent.skills.length > 0 && (
          <div>
            <div className="text-[9px] text-[#1f521f] mb-1">skills:</div>
            <div className="flex flex-wrap gap-1">
              {agent.skills.slice(0, 5).map((skill) => (
                <span key={skill} className={cn("term-skill text-[9px]", skillColor(skill))}>
                  {skill}
                </span>
              ))}
              {agent.skills.length > 5 && (
                <span className="term-skill text-[9px] text-[#1f521f] border-[#1f521f]/40">
                  +{agent.skills.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {tagline && (
          <div className="text-[10px] text-[#1f521f] border-l border-[#1f521f]/50 pl-2 line-clamp-1">
            // {tagline}
          </div>
        )}

        {/* Stats footer */}
        <div className="border-t border-[#1f521f]/40 pt-2 flex items-center justify-between text-[9px] text-[#1f521f]">
          <span>
            jobs_done: <span className="text-[#33ff00] font-bold">{agent.jobsCompleted.toString()}</span>
          </span>
          <span>{timeAgo(agent.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
