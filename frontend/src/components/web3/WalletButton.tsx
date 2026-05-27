"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready && account && chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 bg-[#1f521f] rounded-full" />
                CONNECT_WALLET
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="text-[10px] py-1.5 px-3 border border-[#ff3333] text-[#ff3333] uppercase tracking-wider font-bold bg-transparent hover:bg-[#ff3333] hover:text-[#0a0a0a] transition-all"
              >
                [ERR]_WRONG_NETWORK
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {/* Chain badge */}
                <button
                  onClick={openChainModal}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[10px] py-1.5 px-2.5 border border-[#1f521f] text-[#1f521f] uppercase tracking-wider font-bold hover:border-[#33ff00] hover:text-[#33ff00] transition-all bg-transparent"
                >
                  {chain.hasIcon && chain.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={chain.name ?? "chain"} src={chain.iconUrl} className="w-3 h-3" />
                  ) : null}
                  {(chain.name ?? "UNKNOWN").replace(/\s+/g, "_")}
                </button>

                {/* Account */}
                <button
                  onClick={openAccountModal}
                  className="inline-flex items-center gap-1.5 text-[10px] py-1.5 px-2.5 border border-[#1f521f] text-[#33ff00] uppercase tracking-wider font-bold hover:border-[#33ff00] hover:bg-[#1f521f]/20 transition-all bg-transparent"
                >
                  <span className="w-1.5 h-1.5 bg-[#33ff00] rounded-full animate-blink shrink-0" />
                  {account.displayName?.replace(/\s+/g, "_") ?? "ACCOUNT"}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
