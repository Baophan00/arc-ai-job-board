// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAgentRegistry.sol";
import "./interfaces/IReputationOracle.sol";

/**
 * @title  ReputationOracle
 * @notice ERC-8004 Reputation Registry implementation.
 *
 * @dev    Collects employer feedback (1–5 stars) after job completion via
 *         the JobRegistry, aggregates scores using a time-weighted moving
 *         average, and pushes the result to AgentRegistry.
 *
 *         Score mapping:
 *           ★☆☆☆☆  (1) → 0   (poor)
 *           ★★☆☆☆  (2) → 25  (below average)
 *           ★★★☆☆  (3) → 50  (average)
 *           ★★★★☆  (4) → 75  (good)
 *           ★★★★★  (5) → 100 (excellent)
 *
 *         Aggregation: linearly-weighted average where newer feedback
 *         carries proportionally higher weight. Converges to a stable
 *         score over time.
 *
 *         Only the authorised JobRegistry may submit feedback (anti-Sybil).
 */
contract ReputationOracle is IReputationOracle, Ownable {
    // ═══════════════════════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice ERC-8004 AgentRegistry (immutable after deployment)
    IAgentRegistry public immutable agentRegistry;

    /// @notice Only this address may call submitFeedback()
    address public jobRegistry;

    /// @dev agentId → all feedback entries
    mapping(bytes32 => Feedback[]) private _feedback;

    /// @dev agentId → latest aggregated score (0–100)
    mapping(bytes32 => uint256) private _scores;

    /// @dev jobId → agentId → feedback already submitted (prevent duplicates)
    mapping(bytes32 => mapping(bytes32 => bool)) private _feedbackGiven;

    // ═══════════════════════════════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error OnlyJobRegistry(address caller);
    error InvalidScore(uint8 score);
    error DuplicateFeedback(bytes32 jobId, bytes32 agentId);
    error AgentNotFound(bytes32 agentId);

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param _agentRegistry  Deployed AgentRegistry address
     * @param _jobRegistry    Deployed JobRegistry address (may be updated later)
     */
    constructor(address _agentRegistry, address _jobRegistry) {
        require(_agentRegistry != address(0), "ReputationOracle: zero agentRegistry");
        agentRegistry = IAgentRegistry(_agentRegistry);
        jobRegistry   = _jobRegistry;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Record employer feedback after a job is completed.
     *
     * @dev  Only the JobRegistry contract may call this.
     *       One feedback entry per (jobId, agentId) pair.
     *       Immediately recalculates the aggregate score and pushes
     *       the result to AgentRegistry.
     *
     *       ERC-8004 Reputation Registry note:
     *       Raw feedback fields (value, valueDecimals, tags) are stored
     *       on-chain. Here we store the equivalent: score (1–5), comment,
     *       and timestamp. Complex off-chain aggregation is replaced by
     *       a simple weighted average for gas efficiency.
     *
     * @param agentId  ERC-8004 agentId being reviewed
     * @param jobId    Completed job that prompted this feedback
     * @param score    Star rating (1 = poor … 5 = excellent)
     * @param comment  Optional employer comment (stored as event data)
     */
    function submitFeedback(
        bytes32        agentId,
        bytes32        jobId,
        uint8          score,
        string calldata comment
    ) external override {
        if (msg.sender != jobRegistry) revert OnlyJobRegistry(msg.sender);
        if (score < 1 || score > 5)   revert InvalidScore(score);
        if (_feedbackGiven[jobId][agentId]) revert DuplicateFeedback(jobId, agentId);

        // Determine the employer's address via tx.origin
        // (JobRegistry is the direct caller; employer is the origin)
        address employer = tx.origin;

        _feedback[agentId].push(Feedback({
            jobId    : jobId,
            agentId  : agentId,
            employer : employer,
            score    : score,
            comment  : comment,
            timestamp: block.timestamp
        }));
        _feedbackGiven[jobId][agentId] = true;

        // Recalculate and persist aggregated score
        uint256 newScore = _calculateScore(agentId);
        _scores[agentId] = newScore;

        // Push to AgentRegistry (requires this contract to be an oracle)
        try agentRegistry.updateReputation(agentId, newScore) {} catch {}

        emit FeedbackSubmitted(agentId, jobId, score, employer);
        emit ReputationRecalculated(agentId, newScore);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Return the latest aggregated reputation score (0–100).
     *
     * @dev Returns 50 (neutral) for agents with no feedback yet.
     *
     * @param agentId  ERC-8004 agentId
     * @return         Aggregated score in [0, 100]
     */
    function getAggregatedScore(bytes32 agentId) external view override returns (uint256) {
        return _scores[agentId] > 0 ? _scores[agentId] : 50;
    }

    /**
     * @notice Return all feedback entries for an agent.
     * @param agentId  ERC-8004 agentId
     * @return         Array of Feedback structs
     */
    function getFeedback(bytes32 agentId) external view override returns (Feedback[] memory) {
        return _feedback[agentId];
    }

    /**
     * @notice Return the number of feedback entries for an agent.
     * @param agentId  ERC-8004 agentId
     * @return         Count
     */
    function getFeedbackCount(bytes32 agentId) external view override returns (uint256) {
        return _feedback[agentId].length;
    }

    /**
     * @notice Check whether feedback has already been submitted for a job.
     * @param jobId    Job identifier
     * @param agentId  Agent identifier
     * @return         True if already submitted
     */
    function hasFeedback(bytes32 jobId, bytes32 agentId) external view returns (bool) {
        return _feedbackGiven[jobId][agentId];
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Update the authorised JobRegistry address.
     * @param newJobRegistry  Address of the new JobRegistry contract
     */
    function setJobRegistry(address newJobRegistry) external onlyOwner {
        require(newJobRegistry != address(0), "ReputationOracle: zero address");
        jobRegistry = newJobRegistry;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INTERNAL — Score Calculation
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @dev  Linearly-weighted average of all feedback scores.
     *
     *       Newer entries receive higher weight:
     *         entry at index i gets weight = (i + 1)
     *         → entry 0 (oldest) : weight 1
     *         → entry n-1 (newest): weight n
     *
     *       Score normalisation:
     *         normalised = (rawScore - 1) * 25  ∈ {0, 25, 50, 75, 100}
     *
     *       Aggregate = Σ(normalised_i × weight_i) / Σ(weight_i)
     *
     * @param agentId  ERC-8004 agentId
     * @return         Aggregated score in [0, 100]
     */
    function _calculateScore(bytes32 agentId) internal view returns (uint256) {
        Feedback[] storage entries = _feedback[agentId];
        uint256 n = entries.length;
        if (n == 0) return 50;

        uint256 weightedSum = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < n; ) {
            uint256 weight     = i + 1;
            uint256 normalised = (uint256(entries[i].score) - 1) * 25;
            weightedSum += normalised * weight;
            totalWeight += weight;
            unchecked { i++; }
        }

        return weightedSum / totalWeight;
    }
}
