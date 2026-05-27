// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title  IReputationOracle
 * @notice ERC-8004 Reputation Registry oracle interface.
 *         Imported by JobRegistry.
 */
interface IReputationOracle {
    struct Feedback {
        bytes32 jobId;
        bytes32 agentId;
        address employer;
        uint8   score;        // 1–5
        string  comment;
        uint256 timestamp;
    }

    event FeedbackSubmitted(
        bytes32 indexed agentId,
        bytes32 indexed jobId,
        uint8           score,
        address         employer
    );

    event ReputationRecalculated(bytes32 indexed agentId, uint256 newScore);

    // ─── Write ────────────────────────────────────────────────────────────

    function submitFeedback(
        bytes32        agentId,
        bytes32        jobId,
        uint8          score,
        string calldata comment
    ) external;

    // ─── Read ─────────────────────────────────────────────────────────────

    function getAggregatedScore(bytes32 agentId) external view returns (uint256);
    function getFeedback(bytes32 agentId) external view returns (Feedback[] memory);
    function getFeedbackCount(bytes32 agentId) external view returns (uint256);
}
