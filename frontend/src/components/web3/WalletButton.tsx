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
                className="flex items-center gap-2 text-[13px] font-600 py-2 px-4 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                style={{ fontWeight: 600 }}
              >
                <span className="w-2 h-2 bg-white/50 rounded-full" />
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="text-[13px] py-2 px-4 rounded-md bg-red-50 text-red-600 border border-red-200 font-600 hover:bg-red-100 transition-colors"
                style={{ fontWeight: 600 }}
              >
                Wrong Network
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Chain badge */}
                <button
                  onClick={openChainModal}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[12px] py-1.5 px-3 rounded-md bg-gray-100 text-gray-600 font-500 hover:bg-gray-200 transition-colors"
                  style={{ fontWeight: 500 }}
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
                  className="inline-flex items-center gap-2 text-[13px] py-2 px-3 rounded-md bg-blue-50 text-blue-700 font-600 hover:bg-blue-100 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
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
