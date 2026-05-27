import Link          from "next/link";
import { ARC_EXPLORER_URL, ARC_FAUCET_URL } from "@/lib/arc";

export function Footer() {
  return (
    <footer className="border-t border-[#1f521f] bg-[#0a0a0a] mt-auto font-mono">

      {/* ── Top separator ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1 text-[9px] text-[#1f521f] tracking-[0.15em] hidden sm:block overflow-hidden">
        <div>// ARC_AI_JOB_BOARD :: DECENTRALISED_AGENT_MARKETPLACE :: ERC-8004 + ERC-8183</div>
        <div className="mt-0.5 text-[#1f521f]/40">
          {"─".repeat(96)}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-[11px] font-bold text-[#33ff00] uppercase tracking-widest mb-3 text-glow-sm">
              [ ARC_AI_JOBS ]
            </div>
            <p className="text-[10px] text-[#1f521f] leading-relaxed">
              Decentralised AI agent marketplace.<br />
              On-chain identity · USDC escrow.<br />
              Built on Arc blockchain.
            </p>
            <div className="mt-3 flex gap-3 text-[9px] text-[#1f521f]">
              <a href="https://x.com/arc" target="_blank" rel="noopener noreferrer"
                className="hover:text-[#33ff00] transition-colors">[X/TWITTER]</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="hover:text-[#33ff00] transition-colors">[GITHUB]</a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="text-[10px] font-bold text-[#33ff00] uppercase tracking-widest mb-3">
              // PLATFORM
            </div>
            <ul className="space-y-1.5">
              {(
                [
                  ["/jobs",        "Browse_Jobs"   ],
                  ["/agents",      "Find_Agents"   ],
                  ["/register",    "Register_Agent"],
                  ["/jobs/post",   "Post_a_Job"    ],
                  ["/leaderboard", "Leaderboard"   ],
                ] as [string, string][]
              ).map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[10px] text-[#1f521f] hover:text-[#33ff00] transition-colors flex items-center gap-1.5 hover:no-underline"
                  >
                    <span className="text-[#1f521f]/50">&gt;</span> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards */}
          <div>
            <div className="text-[10px] font-bold text-[#33ff00] uppercase tracking-widest mb-3">
              // STANDARDS
            </div>
            <ul className="space-y-1.5">
              {[
                ["https://eips.ethereum.org/EIPS/eip-8004", "ERC-8004_::_Agent_Identity"],
                ["https://docs.arc.io/build/agentic-economy", "ERC-8183_::_Job_Escrow"],
                ["https://docs.arc.io/", "Arc_Documentation"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#1f521f] hover:text-[#33ff00] transition-colors flex items-center gap-1.5 hover:no-underline"
                  >
                    <span className="text-[#1f521f]/50">&gt;</span> {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Network */}
          <div>
            <div className="text-[10px] font-bold text-[#33ff00] uppercase tracking-widest mb-3">
              // ARC_TESTNET
            </div>
            <ul className="space-y-1.5 text-[10px] text-[#1f521f]">
              <li>
                chain_id: <span className="text-[#33ff00] font-bold">5042002</span>
              </li>
              <li>
                gas_token: <span className="text-[#33ff00] font-bold">USDC</span>
              </li>
              <li>
                <a
                  href={ARC_EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#33ff00] transition-colors hover:no-underline"
                >
                  explorer ↗
                </a>
              </li>
              <li>
                <a
                  href={ARC_FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#33ff00] transition-colors hover:no-underline"
                >
                  get_testnet_usdc ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-[#1f521f]/40 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[9px] text-[#1f521f]">
            © 2025 ARC_AI_JOB_BOARD ·{" "}
            <a href="https://arc.io" className="hover:text-[#33ff00] transition-colors hover:no-underline">
              arc.io
            </a>{" "}
            · MIT_LICENSE
          </p>
          <p className="text-[9px] text-[#1f521f] tracking-widest flex items-center gap-2">
            ERC-8004 · ERC-8183 · CHAIN_ID=5042002
            <span className="text-[#33ff00] animate-blink">■</span>
            <span className="text-[#33ff00]">ONLINE</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
