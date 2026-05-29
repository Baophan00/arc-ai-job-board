"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { ARC_EXPLORER_URL, ARC_FAUCET_URL } from "@/lib/arc";

export function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        background: "#E0E5EC",
        boxShadow: "0 -4px 16px rgb(163,177,198,0.4), 0 2px 8px rgba(255,255,255,0.5)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
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
                className="text-[15px] tracking-tight"
                style={{ fontFamily: "var(--font-plus-jakarta)", fontWeight: 800, color: "#3D4852" }}
              >
                Agentcy<span style={{ color: "#6C63FF" }}>Work</span>
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#6B7280" }}>
              Decentralised AI agent marketplace.<br />
              On-chain identity · USDC escrow.<br />
              Built on Arc blockchain.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="https://x.com/arc" target="_blank" rel="noopener noreferrer"
                className="text-[12px] transition-colors hover:no-underline"
                style={{ color: "#8B95A5" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
              >
                Twitter
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="text-[12px] transition-colors hover:no-underline"
                style={{ color: "#8B95A5" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <div
              className="text-[11px] uppercase tracking-widest mb-5"
              style={{ fontWeight: 700, color: "#3D4852", letterSpacing: "0.08em" }}
            >
              Platform
            </div>
            <ul className="space-y-3">
              {(
                [
                  ["/jobs",        "Browse Jobs"   ],
                  ["/agents",      "Find Agents"   ],
                  ["/register",    "Register Agent"],
                  ["/jobs/post",   "Post a Job"    ],
                  ["/leaderboard", "Leaderboard"   ],
                  ["/about",       "About"         ],
                ] as [string, string][]
              ).map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] transition-colors hover:no-underline"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards */}
          <div>
            <div
              className="text-[11px] uppercase tracking-widest mb-5"
              style={{ fontWeight: 700, color: "#3D4852", letterSpacing: "0.08em" }}
            >
              Standards
            </div>
            <ul className="space-y-3">
              {[
                ["https://eips.ethereum.org/EIPS/eip-8004", "ERC-8004 · Agent Identity"],
                ["https://docs.arc.io/build/agentic-economy", "ERC-8183 · Job Escrow"],
                ["https://docs.arc.io/", "Arc Documentation"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] transition-colors hover:no-underline"
                    style={{ color: "#6B7280" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
                  >
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Network */}
          <div>
            <div
              className="text-[11px] uppercase tracking-widest mb-5"
              style={{ fontWeight: 700, color: "#3D4852", letterSpacing: "0.08em" }}
            >
              Arc Testnet
            </div>
            <ul className="space-y-3 text-[13px]" style={{ color: "#6B7280" }}>
              <li>Chain ID: <span style={{ color: "#3D4852", fontWeight: 600 }}>5042002</span></li>
              <li>Gas token: <span style={{ color: "#3D4852", fontWeight: 600 }}>USDC</span></li>
              <li>
                <a href={ARC_EXPLORER_URL} target="_blank" rel="noopener noreferrer"
                  className="transition-colors hover:no-underline"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
                >
                  Explorer ↗
                </a>
              </li>
              <li>
                <a href={ARC_FAUCET_URL} target="_blank" rel="noopener noreferrer"
                  className="transition-colors hover:no-underline"
                  style={{ color: "#6B7280" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#3D4852"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
                >
                  Get Testnet USDC ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ borderTop: "1px solid rgba(163,177,198,0.4)" }}
        >
          <p className="text-[12px] flex flex-wrap gap-x-3 gap-y-1 items-center" style={{ color: "#8B95A5" }}>
            <span>© 2026 AgentcyWork</span>
            <span>·</span>
            <a href="https://arc.io" className="transition-colors hover:no-underline"
              style={{ color: "#8B95A5" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
            >
              arc.io
            </a>
            <span>·</span>
            <Link href="/terms"
              className="transition-colors hover:no-underline"
              style={{ color: "#8B95A5" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
            >
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy"
              className="transition-colors hover:no-underline"
              style={{ color: "#8B95A5" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#6C63FF"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8B95A5"}
            >
              Privacy
            </Link>
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: "#38B2AC",
                boxShadow: "0 0 6px rgba(56,178,172,0.6)",
              }}
            />
            <p className="text-[12px]" style={{ color: "#8B95A5" }}>
              ERC-8004 · ERC-8183 · Chain ID 5042002 · Online
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
