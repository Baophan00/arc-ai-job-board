import Link from "next/link";
import { cn, timeAgo, formatDeadline, formatUsdc } from "@/lib/utils";
import { JOB_STATUS, type JobStatusNumber } from "@/lib/contracts";
import type { Job } from "@/types";
import { JobStatus } from "@/types";

interface Props {
  job:       Job;
  featured?: boolean;
}

const STATUS_STYLES: Record<number, { badge: string; dot: string }> = {
  [JobStatus.Open]:       { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  [JobStatus.Assigned]:   { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  [JobStatus.InProgress]: { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  [JobStatus.Submitted]:  { badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
  [JobStatus.Completed]:  { badge: "bg-gray-100 text-gray-600",       dot: "bg-gray-400"    },
  [JobStatus.Disputed]:   { badge: "bg-red-100 text-red-700",         dot: "bg-red-500"     },
  [JobStatus.Resolved]:   { badge: "bg-gray-100 text-gray-600",       dot: "bg-gray-400"    },
  [JobStatus.Cancelled]:  { badge: "bg-gray-100 text-gray-400",       dot: "bg-gray-300"    },
};

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

export function JobCard({ job, featured }: Props) {
  const rawLabel    = JOB_STATUS[job.status as JobStatusNumber] ?? "Unknown";
  const statusStyle = STATUS_STYLES[job.status] ?? { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  const idSuffix    = String(job.jobId).slice(-8);
  const isOpen      = job.status === JobStatus.Open;

  return (
    <Link
      href={`/jobs/${job.jobId}`}
      className="block bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:no-underline transition-all group"
      style={{ transition: "transform 0.15s ease, border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div className="p-5">
        {/* Top row: ID + status badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-gray-400 font-500" style={{ fontWeight: 500 }}>
            #{idSuffix}
          </span>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-600",
            statusStyle.badge
          )} style={{ fontWeight: 600 }}>
            <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
            {rawLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-700 text-gray-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors" style={{ fontWeight: 700 }}>
          {job.title}
        </h3>

        {/* Employer */}
        <div className="text-[12px] text-gray-400 mb-3">
          by <span className="text-gray-600 font-500" style={{ fontWeight: 500 }}>
            {job.employer.slice(0, 6)}…{job.employer.slice(-4)}
          </span>
        </div>

        {/* Description */}
        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {job.description}
        </p>

        {/* Skills */}
        {job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.requiredSkills.slice(0, 4).map((skill) => (
              <span key={skill} className={cn(
                "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-500 border",
                getSkillStyle(skill)
              )} style={{ fontWeight: 500 }}>
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-500 border bg-gray-50 text-gray-400 border-gray-200" style={{ fontWeight: 500 }}>
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[15px] font-700 text-blue-600" style={{ fontWeight: 700 }}>
            {formatUsdc(job.budget)} USDC
          </span>
          <div className="flex items-center gap-3 text-[12px] text-gray-400">
            <span className={cn(isOpen ? "text-amber-600 font-500" : "")} style={{ fontWeight: isOpen ? 500 : 400 }}>
              {formatDeadline(job.deadline)}
            </span>
            <span>{timeAgo(job.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
