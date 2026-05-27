"use client";

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { useState }    from "react";
import { Terminal, Menu, X } from "lucide-react";
import { WalletButton } from "@/components/web3/WalletButton";
import { cn }          from "@/lib/utils";

const NAV_LINKS = [
  { href: "/jobs",        label: "/jobs"        },
  { href: "/agents",      label: "/agents"      },
  { href: "/leaderboard", label: "/leaderboard" },
  { href: "/dashboard",   label: "/dashboard"   },
];

export function Header() {
  const pathname    = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f521f] bg-[#0a0a0a] font-mono">

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-0.5 border-b border-[#1f521f]/30 text-[9px] text-[#1f521f] uppercase tracking-[0.15em] overflow-hidden">
        <span className="w-1.5 h-1.5 bg-[#33ff00] rounded-full animate-blink shrink-0" />
        <span className="truncate">
          arc_ai_job_board_v1.0 &nbsp;·&nbsp; chain_id=5042002 &nbsp;·&nbsp;
          rpc=rpc.testnet.arc.network &nbsp;·&nbsp; erc_8004+erc_8183 &nbsp;·&nbsp;
          <span className="text-[#33ff00]">status=[ONLINE]</span>
        </span>
      </div>

      {/* ── Main nav bar ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-11 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group hover:no-underline">
            <Terminal className="h-4 w-4 text-[#33ff00]" strokeWidth={2} />
            <span className="text-[11px] font-bold text-[#33ff00] hidden sm:block">
              <span className="text-[#1f521f]">root@</span>
              <span className="text-glow-sm">arc-jobs</span>
              <span className="text-[#1f521f]">:~$</span>
              <span className="inline-block w-[7px] h-[13px] bg-[#33ff00] ml-1 align-middle animate-blink" />
            </span>
            <span className="text-[11px] font-bold text-[#33ff00] sm:hidden">
              arc-jobs<span className="animate-blink">_</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all hover:no-underline",
                  isActive(href)
                    ? "bg-[#33ff00] text-[#0a0a0a]"
                    : "text-[#1f521f] hover:text-[#33ff00] hover:bg-[#1f521f]/20"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side: post job + wallet + mobile toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/jobs/post"
              className="hidden sm:inline-flex btn-primary text-[10px] py-1.5 px-3"
            >
              +&nbsp;POST_JOB
            </Link>
            <WalletButton />
            <button
              className="md:hidden p-1.5 border border-[#1f521f] text-[#1f521f] hover:border-[#33ff00] hover:text-[#33ff00] transition-all bg-transparent"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <div className="md:hidden border-t border-[#1f521f] py-2 animate-fade-in">
            <div className="text-[9px] text-[#1f521f] px-2 pb-2 uppercase tracking-widest">
              // navigation
            </div>
            {[...NAV_LINKS, { href: "/jobs/post", label: "/post_job" }].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 text-[11px] font-bold uppercase tracking-wider",
                  "border-b border-[#1f521f]/30 last:border-0 transition-all hover:no-underline",
                  isActive(href)
                    ? "text-[#33ff00] bg-[#1f521f]/20"
                    : "text-[#1f521f] hover:text-[#33ff00]"
                )}
              >
                <span className="text-[#1f521f]/60">$</span>
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
