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
];

export function Header() {
  const pathname    = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 hover:no-underline">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-800 text-gray-900 tracking-tight hidden sm:block" style={{ fontWeight: 800 }}>
              Agentcy<span className="text-blue-500">Work</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2 text-[13px] font-600 rounded-md transition-all hover:no-underline",
                  isActive(href)
                    ? "bg-blue-50 text-blue-600 font-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
                style={{ fontWeight: isActive(href) ? 700 : 600 }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href="/jobs/post"
              className="hidden sm:inline-flex btn-primary text-[13px] py-2 px-4"
            >
              + Post Job
            </Link>
            <NotificationBell />
            <WalletButton />
            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all bg-transparent border-0"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-2 animate-fade-in">
            {[...NAV_LINKS, { href: "/jobs/post", label: "Post Job" }].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-[14px] rounded-md mx-1 my-0.5 transition-all hover:no-underline",
                  isActive(href)
                    ? "text-blue-600 bg-blue-50 font-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
                style={{ fontWeight: isActive(href) ? 600 : 400 }}
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
