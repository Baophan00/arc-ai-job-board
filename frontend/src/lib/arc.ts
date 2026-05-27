/**
 * arc.ts — Arc blockchain chain configuration for wagmi/viem
 *
 * Arc Testnet:
 *   Chain ID  : 5042002
 *   RPC       : https://rpc.testnet.arc.network
 *   Explorer  : https://testnet.arcscan.app
 *   Gas token : USDC (18 dec native, 6 dec ERC-20)
 *   Faucet    : https://faucet.circle.com
 */

import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id:   5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name:     "USD Coin",
    symbol:   "USDC",
    decimals: 18,   // native gas token uses 18 decimals
  },
  rpcUrls: {
    default: {
      http:      ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
    blockdaemon: {
      http:      ["https://rpc.blockdaemon.testnet.arc.network"],
      webSocket: ["wss://rpc.blockdaemon.testnet.arc.network:443/websocket"],
    },
    drpc: {
      http:      ["https://rpc.drpc.testnet.arc.network"],
      webSocket: ["wss://rpc.drpc.testnet.arc.network"],
    },
    quicknode: {
      http:      ["https://rpc.quicknode.testnet.arc.network"],
      webSocket: ["wss://rpc.quicknode.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url:  "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

// ─── Useful constants ─────────────────────────────────────────────────────────

/** USDC ERC-20 on Arc Testnet (6 decimals) */
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;

/** Arc Testnet faucet */
export const ARC_FAUCET_URL = "https://faucet.circle.com";

/** Arc block explorer base URL */
export const ARC_EXPLORER_URL = "https://testnet.arcscan.app";

/** Format USDC amount (6 decimals → human readable) */
export function formatUsdc(amount: bigint): string {
  const value = Number(amount) / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style:                "currency",
    currency:             "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Parse human USDC string to bigint (6 decimals) */
export function parseUsdc(amount: string): bigint {
  const value = parseFloat(amount);
  if (isNaN(value) || value < 0) throw new Error("Invalid USDC amount");
  return BigInt(Math.round(value * 1_000_000));
}

/** Get transaction link on ArcScan */
export function txLink(hash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

/** Get address link on ArcScan */
export function addressLink(addr: string): string {
  return `${ARC_EXPLORER_URL}/address/${addr}`;
}
