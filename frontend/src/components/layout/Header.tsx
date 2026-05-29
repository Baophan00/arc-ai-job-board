"use client";

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { useState }    from "react";
import { Zap, Menu, X } from "lucide-react";
import { WalletButton }      from "@/components/web3/WalletButton";
import { NotificationBell }  from "@/components/layout/NotificationBell";
import { cn }                from "@/lib/utils";

const NAV_LINKS = [
  { href: "/jobs",        label: "Jobs"        },
  { href: "/agents",      label: "Agents"      },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard",   label: "Dashboard"   },
  { href: "/about",       label: "About"       },
];

export function Header() {
  const pathname    = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "#E0E5EC",
        boxShadow: "0 4px 16px rgb(163,177,198,0.5), 0 -2px 8px rgba(255,255,255,0.6)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:no-underline">
            <div
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{
                background: "#6C63FF",
                boxShadow: "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)",
              }}
            >
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="text-[16px] tracking-tight hidden sm:block"
              style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
            >
              Agentcy<span style={{ color: "#6C63FF" }}>Work</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2 text-[13px] font-semibold rounded-2xl transition-all duration-300 hover:no-underline",
                )}
                style={{
                  fontWeight: 600,
                  color: isActive(href) ? "#6C63FF" : "#6B7280",
                  boxShadow: isActive(href)
                    ? "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)"
                    : "none",
                  background: "#E0E5EC",
                  transition: "all 0.3s ease-out",
                }}
                onMouseEnter={e => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 10px rgb(163,177,198,0.5), -5px -5px 10px rgba(255,255,255,0.4)";
                    (e.currentTarget as HTMLElement).style.color = "#3D4852";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.color = "#6B7280";
                  }
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            <Link href="/jobs/post" className="hidden sm:inline-flex btn-primary text-[13px] py-2 px-4">
              + Post Job
            </Link>
            <NotificationBell />
            <WalletButton />
            <button
              className="md:hidden p-2 rounded-2xl text-[#6B7280] transition-all duration-300 bg-transparent border-0 cursor-pointer"
              style={{ boxShadow: "5px 5px 10px rgb(163,177,198,0.5), -5px -5px 10px rgba(255,255,255,0.4)" }}
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <div
            className="md:hidden py-3 pb-4 animate-fade-in"
            style={{
              borderTop: "1px solid rgba(163,177,198,0.3)",
            }}
          >
            {[...NAV_LINKS, { href: "/jobs/post", label: "Post Job" }].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center px-4 py-3 text-[14px] rounded-2xl mx-1 my-0.5 transition-all duration-300 hover:no-underline"
                style={{
                  fontWeight: isActive(href) ? 600 : 400,
                  color: isActive(href) ? "#6C63FF" : "#6B7280",
                  boxShadow: isActive(href)
                    ? "inset 6px 6px 10px rgb(163,177,198,0.6), inset -6px -6px 10px rgba(255,255,255,0.5)"
                    : "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
