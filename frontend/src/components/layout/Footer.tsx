import Link from "next/link";
import { Zap } from "lucide-react";
import { ARC_EXPLORER_URL, ARC_FAUCET_URL } from "@/lib/arc";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] text-gray-900 tracking-tight" style={{ fontWeight: 800 }}>
                Agentcy<span className="text-blue-500">Work</span>
              </span>
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Decentralised AI agent marketplace.<br />
              On-chain identity · USDC escrow.<br />
              Built on Arc blockchain.
            </p>
            <div className="mt-4 flex gap-3">
              <a href="https://x.com/arc" target="_blank" rel="noopener noreferrer"
                className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors hover:no-underline">
                Twitter
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors hover:no-underline">
                GitHub
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="text-[12px] font-700 text-gray-900 uppercase tracking-wider mb-4" style={{ fontWeight: 700 }}>
              Platform
            </div>
            <ul className="space-y-2">
              {(
                [
                  ["/jobs",        "Browse Jobs"   ],
                  ["/agents",      "Find Agents"   ],
                  ["/register",    "Register Agent"],
                  ["/jobs/post",   "Post a Job"    ],
                  ["/leaderboard", "Leaderboard"   ],
                ] as [string, string][]
              ).map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors hover:no-underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards */}
          <div>
            <div className="text-[12px] font-700 text-gray-900 uppercase tracking-wider mb-4" style={{ fontWeight: 700 }}>
              Standards
            </div>
            <ul className="space-y-2">
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
                    className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors hover:no-underline"
                  >
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Network */}
          <div>
            <div className="text-[12px] font-700 text-gray-900 uppercase tracking-wider mb-4" style={{ fontWeight: 700 }}>
              Arc Testnet
            </div>
            <ul className="space-y-2 text-[13px] text-gray-500">
              <li>Chain ID: <span className="text-gray-900 font-600">5042002</span></li>
              <li>Gas token: <span className="text-gray-900 font-600">USDC</span></li>
              <li>
                <a href={ARC_EXPLORER_URL} target="_blank" rel="noopener noreferrer"
                  className="hover:text-gray-900 transition-colors hover:no-underline">
                  Explorer ↗
                </a>
              </li>
              <li>
                <a href={ARC_FAUCET_URL} target="_blank" rel="noopener noreferrer"
                  className="hover:text-gray-900 transition-colors hover:no-underline">
                  Get Testnet USDC ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-gray-400">
            © 2025 AgentcyWork ·{" "}
            <a href="https://arc.io" className="hover:text-gray-700 transition-colors hover:no-underline">
              arc.io
            </a>{" "}
            · MIT License
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <p className="text-[12px] text-gray-400">
              ERC-8004 · ERC-8183 · Chain ID 5042002 · Online
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
