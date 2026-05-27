/**
 * deploy.ts — Full Arc AI Job Board deployment script
 *
 * Deploy order:
 *   1. AgentRegistry   (ERC-8004 Identity/Reputation/Validation)
 *   2. ReputationOracle
 *   3. JobRegistry     (ERC-8183 Escrow & Settlement)
 *   4. Marketplace     (Platform hub)
 *
 * Post-deploy wiring:
 *   • agentRegistry.setOracle(reputationOracle, true)
 *   • agentRegistry.setOracle(jobRegistry, true)
 *   • reputationOracle.setJobRegistry(jobRegistry)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network arcTestnet
 */

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ─── Arc Testnet constants ────────────────────────────────────────────────────
const ARC_TESTNET_CHAIN_ID = 5042002;
const USDC_ARC             = "0x3600000000000000000000000000000000000000";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║          Arc AI Job Board — Contract Deployment          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`  Network   : ${network.name} (chainId: ${(await ethers.provider.getNetwork()).chainId})`);
  console.log(`  Deployer  : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance   : ${ethers.formatUnits(balance, 18)} USDC (native)\n`);

  // ── 1. AgentRegistry ────────────────────────────────────────────────────
  process.stdout.write("  Deploying AgentRegistry …      ");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddr = await agentRegistry.getAddress();
  console.log(`✅  ${agentRegistryAddr}`);

  // ── 2. ReputationOracle ─────────────────────────────────────────────────
  process.stdout.write("  Deploying ReputationOracle …   ");
  const ReputationOracle = await ethers.getContractFactory("ReputationOracle");
  const reputationOracle = await ReputationOracle.deploy(
    agentRegistryAddr,
    ethers.ZeroAddress // jobRegistry set after
  );
  await reputationOracle.waitForDeployment();
  const reputationOracleAddr = await reputationOracle.getAddress();
  console.log(`✅  ${reputationOracleAddr}`);

  // ── 3. JobRegistry ──────────────────────────────────────────────────────
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  process.stdout.write("  Deploying JobRegistry …        ");
  const JobRegistry = await ethers.getContractFactory("JobRegistry");
  const jobRegistry = await JobRegistry.deploy(
    agentRegistryAddr,
    reputationOracleAddr,
    feeRecipient
  );
  await jobRegistry.waitForDeployment();
  const jobRegistryAddr = await jobRegistry.getAddress();
  console.log(`✅  ${jobRegistryAddr}`);

  // ── 4. Marketplace ──────────────────────────────────────────────────────
  process.stdout.write("  Deploying Marketplace …        ");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    agentRegistryAddr,
    jobRegistryAddr,
    reputationOracleAddr
  );
  await marketplace.waitForDeployment();
  const marketplaceAddr = await marketplace.getAddress();
  console.log(`✅  ${marketplaceAddr}\n`);

  // ── Post-deploy wiring ───────────────────────────────────────────────────
  console.log("  Wiring contracts …");

  // Grant JobRegistry oracle access to AgentRegistry
  process.stdout.write("    agentRegistry.setOracle(jobRegistry) … ");
  await (await agentRegistry.setOracle(jobRegistryAddr, true)).wait();
  console.log("✅");

  // Grant ReputationOracle access to AgentRegistry
  process.stdout.write("    agentRegistry.setOracle(reputationOracle) … ");
  await (await agentRegistry.setOracle(reputationOracleAddr, true)).wait();
  console.log("✅");

  // Tell ReputationOracle which JobRegistry is authorised
  process.stdout.write("    reputationOracle.setJobRegistry(jobRegistry) … ");
  await (await reputationOracle.setJobRegistry(jobRegistryAddr)).wait();
  console.log("✅\n");

  // ── Save deployment ──────────────────────────────────────────────────────
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const deployment = {
    network:           network.name,
    chainId,
    deployedAt:        new Date().toISOString(),
    deployer:          deployer.address,
    feeRecipient,
    usdc:              USDC_ARC,
    contracts: {
      AgentRegistry:    agentRegistryAddr,
      ReputationOracle: reputationOracleAddr,
      JobRegistry:      jobRegistryAddr,
      Marketplace:      marketplaceAddr,
    },
    explorerBase: chainId === ARC_TESTNET_CHAIN_ID
      ? "https://testnet.arcscan.app/address/"
      : "",
  };

  const deploymentsDir  = path.join(__dirname, "..", "deployments");
  const deploymentFile  = path.join(deploymentsDir, `${network.name}.json`);
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));

  // Also write a frontend-friendly .env snippet
  const envSnippet = `
# ── Deployed on ${network.name} (${new Date().toISOString()}) ──────────────
NEXT_PUBLIC_CHAIN_ID=${chainId}
NEXT_PUBLIC_AGENT_REGISTRY=${agentRegistryAddr}
NEXT_PUBLIC_JOB_REGISTRY=${jobRegistryAddr}
NEXT_PUBLIC_REPUTATION_ORACLE=${reputationOracleAddr}
NEXT_PUBLIC_MARKETPLACE=${marketplaceAddr}
NEXT_PUBLIC_USDC=${USDC_ARC}
`.trim();

  fs.writeFileSync(path.join(deploymentsDir, `${network.name}.env`), envSnippet);

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                  Deployment Complete ✅                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`  AgentRegistry    : ${agentRegistryAddr}`);
  console.log(`  ReputationOracle : ${reputationOracleAddr}`);
  console.log(`  JobRegistry      : ${jobRegistryAddr}`);
  console.log(`  Marketplace      : ${marketplaceAddr}`);
  if (deployment.explorerBase) {
    console.log(`\n  Explorer links:`);
    for (const [name, addr] of Object.entries(deployment.contracts)) {
      console.log(`    ${name.padEnd(18)}: ${deployment.explorerBase}${addr}`);
    }
  }
  console.log(`\n  Saved → ${deploymentFile}`);
  console.log(`  .env  → ${path.join(deploymentsDir, `${network.name}.env`)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
