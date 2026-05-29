// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IAgentRegistry.sol";

/**
 * @title  AgentRegistry
 * @notice ERC-8004 compliant AI Agent Identity, Reputation & Validation Registry.
 *
 * @dev    ERC-8004 defines three sub-registries:
 *           1. Identity Registry   — ERC-721 NFT-based agent identity
 *           2. Reputation Registry — oracle-fed aggregated score (0–100)
 *           3. Validation Registry — owner-controlled agent verification
 *
 *         ┌─────────────────────────────────────────────────────────────┐
 *         │  Arc Testnet                                                │
 *         │  Chain ID  : 5042002                                        │
 *         │  RPC       : https://rpc.testnet.arc.network                │
 *         │  Explorer  : https://testnet.arcscan.app                    │
 *         │  USDC      : 0x3600000000000000000000000000000000000000     │
 *         │  Faucet    : https://faucet.circle.com                      │
 *         └─────────────────────────────────────────────────────────────┘
 *
 *         ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
 *         ERC-8183 companion: JobRegistry.sol
 */
contract AgentRegistry is IAgentRegistry, ERC721, Ownable {
    using Counters for Counters.Counter;

    // ═══════════════════════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Auto-incrementing ERC-721 token counter (starts at 1)
    Counters.Counter private _tokenIdCounter;

    /// @dev ERC-721 tokenId → Agent
    mapping(uint256 => Agent) private _agents;

    /// @dev bytes32 agentId → ERC-721 tokenId
    mapping(bytes32 => uint256) private _agentIdToToken;

    /// @dev wallet address → ERC-721 tokenId  (1 registration per wallet)
    mapping(address => uint256) private _walletToToken;

    /**
     * @dev Reputation oracle allowlist.
     *      Authorised addresses (e.g. ReputationOracle, JobRegistry)
     *      that may call updateReputation() and incrementJobsCompleted().
     */
    mapping(address => bool) private _reputationOracles;

    // ═══════════════════════════════════════════════════════════════════════
    //  EVENTS  (in addition to interface events)
    // ═══════════════════════════════════════════════════════════════════════

    event AgentURIUpdated(bytes32 indexed agentId, string newURI);
    event SkillsUpdated(bytes32 indexed agentId, string[] skills);
    event OracleUpdated(address indexed oracle, bool authorised);

    // ═══════════════════════════════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error AlreadyRegistered(address wallet);
    error AgentNotFound(bytes32 agentId);
    error ScoreOutOfRange(uint256 score);
    error NotAgentOwner(address caller);
    error NotAuthorisedOracle(address caller);

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploy AgentRegistry.
     * @dev    ERC-721 name: "Arc AI Agent"  symbol: "ARCAGENT"
     *         Deployer becomes Ownable owner (registry operator).
     */
    constructor() ERC721("Arc AI Agent", "ARCAGENT") {}

    // ═══════════════════════════════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Only authorised reputation oracles or the contract owner.
    modifier onlyOracle() {
        if (!_reputationOracles[msg.sender] && msg.sender != owner()) {
            revert NotAuthorisedOracle(msg.sender);
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Identity Registry
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Register a new AI agent and mint its ERC-721 identity token.
     *
     * @dev ERC-8004 Identity Registry is NFT-based.
     *      One registration per wallet is enforced.
     *      The returned agentId is the primary handle for all subsequent calls.
     *
     *        agentId = keccak256(chainId ++ wallet ++ name)
     *
     *      This is deterministic, chain-namespaced, and collision-resistant.
     *
     * @param name    Human-readable display name.
     * @param skills  Capability tags (ERC-8004 "services" array).
     *
     * @return agentId  bytes32 identifier for all subsequent calls.
     */
    function registerAgent(
        string calldata  name,
        string[] calldata skills
    ) external override returns (bytes32 agentId) {
        if (_walletToToken[msg.sender] != 0) revert AlreadyRegistered(msg.sender);

        // Deterministic, chain-namespaced agentId per ERC-8004 global namespace
        agentId = keccak256(abi.encodePacked(block.chainid, msg.sender, name));

        // Mint ERC-721 — the NFT IS the agent's on-chain identity
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _mint(msg.sender, tokenId);

        _agents[tokenId] = Agent({
            agentId        : agentId,
            wallet         : msg.sender,
            name           : name,
            skills         : skills,
            agentURI       : "",    // Agent sets this via setAgentURI()
            reputationScore: 50,    // Neutral baseline
            jobsCompleted  : 0,
            verified       : false,
            createdAt      : block.timestamp
        });

        _agentIdToToken[agentId]   = tokenId;
        _walletToToken[msg.sender] = tokenId;

        emit AgentRegistered(agentId, msg.sender, name);
    }

    /**
     * @notice Set or update the ERC-8004 off-chain registration file URI.
     *
     * @dev ERC-8004 mandates each agent has a JSON registration file at a URI:
     *      {
     *        "type":                "ERC-8004AgentRegistration/v1",
     *        "name":                "...",
     *        "description":         "...",
     *        "image":               "ipfs://...",
     *        "services":            [...],
     *        "supportedTrustModels":["reputation","validation"]
     *      }
     *
     *      Only the ERC-721 token owner (the agent) may update its URI.
     *
     * @param agentId  bytes32 identifier.
     * @param newURI   HTTPS or IPFS URI.
     */
    function setAgentURI(bytes32 agentId, string calldata newURI) external override {
        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0)                    revert AgentNotFound(agentId);
        if (ownerOf(tokenId) != msg.sender)  revert NotAgentOwner(msg.sender);

        _agents[tokenId].agentURI = newURI;
        emit AgentURIUpdated(agentId, newURI);
    }

    /**
     * @notice Update an agent's skill tags.
     *
     * @dev Only the ERC-721 token owner (the agent) may update skills.
     *      Skills are independent of agentId (which is derived from name + wallet).
     *
     * @param agentId  bytes32 identifier.
     * @param skills   New skills array (replaces existing).
     */
    function updateSkills(bytes32 agentId, string[] calldata skills) external override {
        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0)                    revert AgentNotFound(agentId);
        if (ownerOf(tokenId) != msg.sender)  revert NotAgentOwner(msg.sender);

        _agents[tokenId].skills = skills;
        emit SkillsUpdated(agentId, skills);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Reputation Registry
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Update an agent's aggregated reputation score (0–100).
     *
     * @dev ERC-8004 Reputation Registry stores raw int128 feedback on-chain
     *      and aggregates off-chain. This contract stores the pre-computed
     *      aggregate from the ReputationOracle contract.
     *      Access-controlled via oracle allowlist to prevent griefing.
     *
     * @param agentId   bytes32 identifier.
     * @param newScore  Aggregated score in [0, 100].
     */
    function updateReputation(bytes32 agentId, uint256 newScore) external override onlyOracle {
        if (newScore > 100) revert ScoreOutOfRange(newScore);

        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0) revert AgentNotFound(agentId);

        _agents[tokenId].reputationScore = newScore;
        emit ReputationUpdated(agentId, newScore);
    }

    /**
     * @notice Increment an agent's completed job counter.
     *
     * @dev Called by the ERC-8183 JobRegistry upon job approval.
     *      Restricted to authorised oracles.
     *
     * @param agentId  bytes32 identifier.
     */
    function incrementJobsCompleted(bytes32 agentId) external override onlyOracle {
        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0) revert AgentNotFound(agentId);
        unchecked { _agents[tokenId].jobsCompleted++; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Validation Registry  (owner-only)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Verify an agent (registry operator only).
     *
     * @dev Maps to ERC-8004 Validation Registry's validationResponse().
     *      Verified agents receive a badge in the UI and may apply to
     *      premium jobs that require verification.
     *
     * @param agentId  bytes32 identifier.
     */
    function verifyAgent(bytes32 agentId) external override onlyOwner {
        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0) revert AgentNotFound(agentId);

        _agents[tokenId].verified = true;
        emit AgentVerified(agentId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Retrieve full agent data by bytes32 agentId.
     * @param agentId  Identifier returned by registerAgent().
     * @return         Agent struct.
     */
    function getAgent(bytes32 agentId) external view override returns (Agent memory) {
        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0) revert AgentNotFound(agentId);
        return _agents[tokenId];
    }

    /**
     * @notice Retrieve full agent data by controlling wallet address.
     * @param wallet  The agent's wallet.
     * @return        Agent struct.
     */
    function getAgentByWallet(address wallet) external view override returns (Agent memory) {
        uint256 tokenId = _walletToToken[wallet];
        require(tokenId != 0, "AgentRegistry: wallet not registered");
        return _agents[tokenId];
    }

    /**
     * @notice Get the ERC-721 tokenId for a bytes32 agentId.
     * @param agentId  bytes32 identifier.
     * @return         ERC-721 token ID.
     */
    function getTokenId(bytes32 agentId) external view override returns (uint256) {
        uint256 tokenId = _agentIdToToken[agentId];
        if (tokenId == 0) revert AgentNotFound(agentId);
        return tokenId;
    }

    /**
     * @notice Check if an address has oracle privileges.
     * @param oracle  Address to query.
     * @return        True if authorised.
     */
    function isOracle(address oracle) external view override returns (bool) {
        return _reputationOracles[oracle];
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Grant or revoke reputation oracle privileges.
     *
     * @dev After deployment, call:
     *        agentRegistry.setOracle(address(reputationOracle), true)
     *        agentRegistry.setOracle(address(jobRegistry), true)
     *
     * @param oracle      Address to authorise/revoke.
     * @param authorised  true = grant, false = revoke.
     */
    function setOracle(address oracle, bool authorised) external override onlyOwner {
        _reputationOracles[oracle] = authorised;
        emit OracleUpdated(oracle, authorised);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ERC-721 OVERRIDES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice ERC-721 tokenURI returns the ERC-8004 registration file URI.
     * @param  tokenId  ERC-721 token ID.
     * @return          URI to ERC-8004 registration JSON.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "AgentRegistry: nonexistent token");
        return _agents[tokenId].agentURI;
    }
}
