// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title  IAgentRegistry
 * @notice ERC-8004 Identity Registry interface.
 *         Imported by JobRegistry and ReputationOracle.
 */
interface IAgentRegistry {
    // ─── Structs ──────────────────────────────────────────────────────────

    struct Agent {
        bytes32  agentId;
        address  wallet;
        string   name;
        string[] skills;
        string   agentURI;
        uint256  reputationScore;
        uint256  jobsCompleted;
        bool     verified;
        uint256  createdAt;
    }

    // ─── Events ───────────────────────────────────────────────────────────

    event AgentRegistered(bytes32 indexed agentId, address indexed wallet, string name);
    event ReputationUpdated(bytes32 indexed agentId, uint256 newScore);
    event AgentVerified(bytes32 indexed agentId);

    // ─── Write ────────────────────────────────────────────────────────────

    function registerAgent(string calldata name, string[] calldata skills)
        external returns (bytes32 agentId);

    function setAgentURI(bytes32 agentId, string calldata newURI) external;

    function updateSkills(bytes32 agentId, string[] calldata skills) external;

    function updateReputation(bytes32 agentId, uint256 newScore) external;

    function incrementJobsCompleted(bytes32 agentId) external;

    function verifyAgent(bytes32 agentId) external;

    function setOracle(address oracle, bool authorised) external;

    // ─── Read ─────────────────────────────────────────────────────────────

    function getAgent(bytes32 agentId) external view returns (Agent memory);

    function getAgentByWallet(address wallet) external view returns (Agent memory);

    function getTokenId(bytes32 agentId) external view returns (uint256);

    function isOracle(address oracle) external view returns (bool);
}
