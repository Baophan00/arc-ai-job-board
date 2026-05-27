import Link from "next/link";
import { cn, timeAgo, formatDeadline, formatUsdc, skillColor } from "@/lib/utils";
import { JOB_STATUS, type JobStatusNumber } from "@/lib/contracts";
import type { Job } from "@/types";
import { JobStatus } from "@/types";

interface Props {
  job:       Job;
  featured?: boolean;
}

const STATUS_STYLES: Record<number, string> = {
  [JobStatus.Open]:       "text-[#33ff00] border-[#33ff00]  bg-[rgba(51,255,0,0.08)]",
  [JobStatus.Assigned]:   "text-[#ffb000] border-[#ffb000]  bg-[rgba(255,176,0,0.08)]",
  [JobStatus.InProgress]: "text-[#ffb000] border-[#ffb000]  bg-[rgba(255,176,0,0.08)]",
  [JobStatus.Submitted]:  "text-[#ffb000] border-[#ffb000]  bg-[rgba(255,176,0,0.08)]",
  [JobStatus.Completed]:  "text-[#1f521f] border-[#1f521f]",
  [JobStatus.Disputed]:   "text-[#ff3333] border-[#ff3333]  bg-[rgba(255,51,51,0.08)]",
  [JobStatus.Resolved]:   "text-[#1f521f] border-[#1f521f]",
  [JobStatus.Cancelled]:  "text-[#1f521f] border-[#1f521f]/40",
};

export function JobCard({ job, featured }: Props) {
  const rawLabel  = JOB_STATUS[job.status as JobStatusNumber] ?? "Unknown";
  const statusLabel = rawLabel.toUpperCase().replace(/\s+/g, "_");
  const statusStyle = STATUS_STYLES[job.status] ?? "text-[#1f521f] border-[#1f521f]";
  const idSuffix    = String(job.jobId).slice(-8);
  const isOpen      = job.status === JobStatus.Open;

  return (
    <Link
      href={`/jobs/${job.jobId}`}
      className="block term-card group hover:no-underline font-mono"
    >
      {/* Title bar */}
      <div className="term-card-header">
        <span className="text-[9px]">// JOB:{idSuffix}</span>
        <span className={cn(
          "shrink-0 ml-2 text-[9px] font-bold border px-1 py-px",
          statusStyle
        )}>
          [{statusLabel}]
        </span>
      </div>

      <div className="term-card-body space-y-1.5">
        {/* Title */}
        <div className="text-[12px] font-bold text-[#33ff00] leading-snug">
          <span className="text-[#1f521f] mr-1">$</span>
          <span className="group-hover:text-glow-sm transition-all">{job.title}</span>
        </div>

        {/* Employer */}
        <div className="text-[9px] text-[#1f521f]">
          employer:&nbsp;
          <span className="text-[#33ff00]">
            {job.employer.slice(0, 6)}…{job.employer.slice(-4)}
          </span>
        </div>

        {/* Description */}
        <div className="text-[10px] text-[#1f521f] leading-relaxed line-clamp-2 border-l-2 border-[#1f521f]/40 pl-2">
          {job.description}
        </div>

        {/* Skills */}
        {job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {job.requiredSkills.slice(0, 4).map((skill) => (
              <span key={skill} className={cn("term-skill text-[9px]", skillColor(skill))}>
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 4 && (
              <span className="term-skill text-[9px] text-[#1f521f] border-[#1f521f]/40">
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#1f521f]/40 pt-2 flex items-center justify-between text-[10px]">
          <span className="text-[#33ff00] font-bold text-glow-sm">
            {formatUsdc(job.budget)}&nbsp;USDC
          </span>
          <div className="flex items-center gap-3 text-[#1f521f]">
            <span className={cn(isOpen ? "text-[#ffb000]" : "")}>
              {formatDeadline(job.deadline)}
            </span>
            <span>{timeAgo(job.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
