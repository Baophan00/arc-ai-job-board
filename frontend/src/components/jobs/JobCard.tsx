import Link from "next/link";
import { timeAgo, formatDeadline, formatUsdc } from "@/lib/utils";
import { JOB_STATUS, type JobStatusNumber } from "@/lib/contracts";
import type { Job } from "@/types";
import { JobStatus } from "@/types";

interface Props {
  job:       Job;
  featured?: boolean;
}

const STATUS_STYLES: Record<number, { color: string; dot: string }> = {
  [JobStatus.Open]:       { color: "#38B2AC", dot: "#38B2AC" },
  [JobStatus.Assigned]:   { color: "#F59E0B", dot: "#F59E0B" },
  [JobStatus.InProgress]: { color: "#F59E0B", dot: "#F59E0B" },
  [JobStatus.Submitted]:  { color: "#6C63FF", dot: "#6C63FF" },
  [JobStatus.Completed]:  { color: "#6B7280", dot: "#8B95A5" },
  [JobStatus.Disputed]:   { color: "#EF4444", dot: "#EF4444" },
  [JobStatus.Resolved]:   { color: "#6B7280", dot: "#8B95A5" },
  [JobStatus.Cancelled]:  { color: "#8B95A5", dot: "#B0BBC9" },
};

const SKILL_COLORS: Record<string, string> = {
  solidity:   "#3B82F6",
  rust:       "#EA580C",
  python:     "#CA8A04",
  typescript: "#0284C7",
  javascript: "#CA8A04",
  defi:       "#38B2AC",
  nft:        "#9333EA",
  ai:         "#6C63FF",
  ml:         "#6C63FF",
};

function getSkillColor(skill: string): string {
  return SKILL_COLORS[skill.toLowerCase()] ?? "#6B7280";
}

const neuShadow      = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const neuShadowHover = "12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)";
const neuShadowSm    = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const neuInsetSm     = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

export function JobCard({ job }: Props) {
  const rawLabel    = JOB_STATUS[job.status as JobStatusNumber] ?? "Unknown";
  const statusStyle = STATUS_STYLES[job.status] ?? { color: "#6B7280", dot: "#8B95A5" };
  const idSuffix    = String(job.jobId).slice(-8);
  const isOpen      = job.status === JobStatus.Open;

  return (
    <Link
      href={`/jobs/${job.jobId}`}
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
        {/* Top row: ID + status badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px]" style={{ color: "#8B95A5", fontWeight: 500 }}>#{idSuffix}</span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px]"
            style={{ fontWeight: 600, color: statusStyle.color, background: "#E0E5EC", boxShadow: neuInsetSm }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
            {rawLabel}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-[15px] leading-snug mb-1.5"
          style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#3D4852" }}
        >
          {job.title}
        </h3>

        {/* Employer */}
        <div className="text-[12px] mb-3" style={{ color: "#8B95A5" }}>
          by <span style={{ color: "#6B7280", fontWeight: 500 }}>
            {job.employer.slice(0, 6)}…{job.employer.slice(-4)}
          </span>
        </div>

        {/* Description */}
        <p className="text-[13px] leading-relaxed line-clamp-2 mb-4" style={{ color: "#6B7280" }}>
          {job.description}
        </p>

        {/* Skills */}
        {job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {job.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px]"
                style={{ fontWeight: 500, color: getSkillColor(skill), background: "#E0E5EC", boxShadow: neuShadowSm }}
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px]"
                style={{ fontWeight: 500, color: "#8B95A5", background: "#E0E5EC", boxShadow: neuInsetSm }}
              >
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(163,177,198,0.35)" }}>
          <span
            className="text-[16px]"
            style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 700, color: "#6C63FF" }}
          >
            {formatUsdc(job.budget)} USDC
          </span>
          <div className="flex items-center gap-3 text-[12px]" style={{ color: "#8B95A5" }}>
            <span style={{ color: isOpen ? "#F59E0B" : "#8B95A5", fontWeight: isOpen ? 500 : 400 }}>
              {formatDeadline(job.deadline)}
            </span>
            <span>{timeAgo(job.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
