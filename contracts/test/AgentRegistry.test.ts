import { expect }           from "chai";
import { ethers }           from "hardhat";
import { loadFixture }      from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { AgentRegistry } from "../typechain-types";

describe("AgentRegistry", () => {
  // ── Fixture ────────────────────────────────────────────────────────────
  async function deployFixture() {
    const [owner, alice, bob, oracle] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const registry = (await AgentRegistry.deploy()) as AgentRegistry;
    await registry.waitForDeployment();

    return { registry, owner, alice, bob, oracle };
  }

  // ── Registration ────────────────────────────────────────────────────────
  describe("registerAgent", () => {
    it("mints an ERC-721 NFT and stores agent data", async () => {
      const { registry, alice } = await loadFixture(deployFixture);

      const name   = "AliceBot";
      const skills = ["nlp", "code-review"];

      const tx = await registry.connect(alice).registerAgent(name, skills);
      await tx.wait();

      const tokenId = 1n;
      expect(await registry.ownerOf(tokenId)).to.equal(alice.address);

      const agent = await registry.getAgentByWallet(alice.address);
      expect(agent.name).to.equal(name);
      expect(agent.wallet).to.equal(alice.address);
      expect(agent.skills).to.deep.equal(skills);
      expect(agent.reputationScore).to.equal(50n);
      expect(agent.verified).to.be.false;
    });

    it("returns a deterministic agentId", async () => {
      const { registry, alice } = await loadFixture(deployFixture);

      const tx     = await registry.connect(alice).registerAgent("AliceBot", []);
      const receipt = await tx.wait();
      const event   = receipt?.logs
        .map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } })
        .find((e) => e?.name === "AgentRegistered");

      const agentId = event?.args.agentId as string;
      const agent   = await registry.getAgent(agentId);
      expect(agent.wallet).to.equal(alice.address);
    });

    it("reverts if wallet already registered", async () => {
      const { registry, alice } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("AliceBot", []);
      await expect(registry.connect(alice).registerAgent("AliceBot2", []))
        .to.be.revertedWithCustomError(registry, "AlreadyRegistered");
    });
  });

  // ── setAgentURI ──────────────────────────────────────────────────────────
  describe("setAgentURI", () => {
    it("allows the agent to update its ERC-8004 URI", async () => {
      const { registry, alice } = await loadFixture(deployFixture);

      const tx     = await registry.connect(alice).registerAgent("A", []);
      const receipt = await tx.wait();
      const event   = receipt?.logs
        .map((l) => { try { return registry.interface.parseLog(l); } catch { return null; } })
        .find((e) => e?.name === "AgentRegistered");
      const agentId = event?.args.agentId as string;

      const uri = "ipfs://QmXyz/agent.json";
      await registry.connect(alice).setAgentURI(agentId, uri);

      const agent = await registry.getAgent(agentId);
      expect(agent.agentURI).to.equal(uri);
    });

    it("reverts if caller is not the token owner", async () => {
      const { registry, alice, bob } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);

      await expect(registry.connect(bob).setAgentURI(agent.agentId, "uri"))
        .to.be.revertedWithCustomError(registry, "NotAgentOwner");
    });
  });

  // ── Oracle / Reputation ──────────────────────────────────────────────────
  describe("updateReputation", () => {
    it("allows an authorised oracle to update score", async () => {
      const { registry, owner, alice, oracle } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);

      await registry.connect(owner).setOracle(oracle.address, true);
      await registry.connect(oracle).updateReputation(agent.agentId, 85n);

      const updated = await registry.getAgent(agent.agentId);
      expect(updated.reputationScore).to.equal(85n);
    });

    it("reverts for unauthorised callers", async () => {
      const { registry, alice, bob } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);

      await expect(registry.connect(bob).updateReputation(agent.agentId, 80n))
        .to.be.revertedWithCustomError(registry, "NotAuthorisedOracle");
    });

    it("reverts for score > 100", async () => {
      const { registry, owner, alice } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);

      await expect(registry.connect(owner).updateReputation(agent.agentId, 101n))
        .to.be.revertedWithCustomError(registry, "ScoreOutOfRange");
    });
  });

  // ── Verification ────────────────────────────────────────────────────────
  describe("verifyAgent", () => {
    it("owner can verify an agent", async () => {
      const { registry, owner, alice } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);

      await registry.connect(owner).verifyAgent(agent.agentId);
      const updated = await registry.getAgent(agent.agentId);
      expect(updated.verified).to.be.true;
    });

    it("reverts for non-owner", async () => {
      const { registry, alice, bob } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);

      await expect(registry.connect(bob).verifyAgent(agent.agentId))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // ── ERC-721 ─────────────────────────────────────────────────────────────
  describe("ERC-721", () => {
    it("tokenURI returns the agentURI", async () => {
      const { registry, alice } = await loadFixture(deployFixture);

      await registry.connect(alice).registerAgent("A", []);
      const agent = await registry.getAgentByWallet(alice.address);
      await registry.connect(alice).setAgentURI(agent.agentId, "ipfs://test");

      const tokenId = await registry.getTokenId(agent.agentId);
      expect(await registry.tokenURI(tokenId)).to.equal("ipfs://test");
    });
  });
});
