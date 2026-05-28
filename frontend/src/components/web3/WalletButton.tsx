"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const neuShadow    = "9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)";
const neuShadowSm  = "5px 5px 10px rgb(163,177,198,0.6), -5px -5px 10px rgba(255,255,255,0.5)";
const neuInsetSm   = "inset 3px 3px 6px rgb(163,177,198,0.6), inset -3px -3px 6px rgba(255,255,255,0.5)";

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
                className="flex items-center gap-2 text-[13px] font-semibold py-2.5 px-5 rounded-2xl text-white transition-all duration-300 cursor-pointer border-0"
                style={{
                  background: "#6C63FF",
                  fontWeight: 600,
                  boxShadow: neuShadow,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 20px rgb(163,177,198,0.7), -12px -12px 20px rgba(255,255,255,0.6)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.boxShadow = neuShadow;
                }}
              >
                <span className="w-2 h-2 bg-white/60 rounded-full" />
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="text-[13px] py-2.5 px-5 rounded-2xl font-semibold cursor-pointer border-0 transition-all duration-300"
                style={{
                  background: "#E0E5EC",
                  color: "#EF4444",
                  fontWeight: 600,
                  boxShadow: neuShadow,
                }}
              >
                Wrong Network
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Chain badge */}
                <button
                  onClick={openChainModal}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[12px] py-2 px-3 rounded-2xl font-medium cursor-pointer border-0 transition-all duration-300"
                  style={{
                    background: "#E0E5EC",
                    color: "#6B7280",
                    fontWeight: 500,
                    boxShadow: neuShadowSm,
                  }}
                >
                  {chain.hasIcon && chain.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={chain.name ?? "chain"} src={chain.iconUrl} className="w-3.5 h-3.5 rounded-full" />
                  ) : null}
                  {chain.name ?? "Unknown"}
                </button>

                {/* Account */}
                <button
                  onClick={openAccountModal}
                  className="inline-flex items-center gap-2 text-[13px] py-2 px-3 rounded-2xl font-semibold cursor-pointer border-0 transition-all duration-300"
                  style={{
                    background: "#E0E5EC",
                    color: "#6C63FF",
                    fontWeight: 600,
                    boxShadow: neuInsetSm,
                  }}
                >
                  <span className="w-2 h-2 bg-[#38B2AC] rounded-full shrink-0" />
                  {account.displayName ?? "Account"}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
