import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import * as dotenv from "dotenv";

dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  networks: {
    // ── Arc Testnet ────────────────────────────────────────────────────────
    arcTestnet: {
      url:      process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network",
      chainId:  5042002,
      accounts: [DEPLOYER_KEY],
      gasPrice: "auto",
    },

    // ── Local ──────────────────────────────────────────────────────────────
    hardhat: {
      chainId: 31337,
    },

    localhost: {
      url:     "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },

  // ── Paths ────────────────────────────────────────────────────────────────
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  // ── TypeChain ───────────────────────────────────────────────────────────
  typechain: {
    outDir:    "typechain-types",
    target:    "ethers-v6",
  },

  // ── Contract Sizer ──────────────────────────────────────────────────────
  contractSizer: {
    alphaSort:         true,
    runOnCompile:      false,
    disambiguatePaths: false,
  },

  // ── Gas Reporter ────────────────────────────────────────────────────────
  gasReporter: {
    enabled:      process.env.REPORT_GAS === "true",
    currency:     "USD",
    outputFile:   "gas-report.txt",
    noColors:     true,
  },
};

export default config;
