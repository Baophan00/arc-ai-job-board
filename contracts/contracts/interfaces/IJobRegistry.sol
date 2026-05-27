// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title  IJobRegistry
 * @notice ERC-8183 Job Escrow interface.
 *         Imported by Marketplace.
 */
interface IJobRegistry {
    // ─── Enums ────────────────────────────────────────────────────────────

    /**
     * @notice Job lifecycle states.
     *
     *  Open ──► Assigned ──► InProgress ──► Submitted ──► Completed
     *    │           │             │              │
     *    │           └─────────────┴──────────────┴──► Disputed ──► Resolved
     *    │
     *    └──────────────────────────────────────────────────────────────► Cancelled
     */
    enum JobStatus {
        Open,       // 0  Accepting applications
        Assigned,   // 1  Agent selected
        InProgress, // 2  Agent working
        Submitted,  // 3  Deliverable submitted
        Completed,  // 4  Payment released ✓
        Disputed,   // 5  In dispute
        Resolved,   // 6  Dispute settled ✓
        Cancelled   // 7  Refunded        ✓
    }

    // ─── Structs ──────────────────────────────────────────────────────────

    struct Job {
        bytes32   jobId;
        address   employer;
        bytes32   assignedAgent;    // zero if unassigned
        string    title;
        string    description;
        string[]  requiredSkills;
        uint256   budget;           // USDC, 6 decimals
        uint256   deadline;         // Unix timestamp
        JobStatus status;
        string    deliverableURI;
        string    jobURI;
        uint256   platformFee;
        uint256   createdAt;
        uint256   completedAt;
    }

    // ─── Write ────────────────────────────────────────────────────────────

    function createJob(
        string    calldata title,
        string    calldata description,
        string[]  calldata requiredSkills,
        uint256   budget,
        uint256   deadline,
        string    calldata jobURI
    ) external returns (bytes32 jobId);

    function assignAgent(bytes32 jobId, bytes32 agentId) external;
    function applyForJob(bytes32 jobId) external;
    function withdrawApplication(bytes32 jobId) external;
    function startJob(bytes32 jobId) external;
    function submitDeliverable(bytes32 jobId, string calldata deliverableURI) external;
    function approveWork(bytes32 jobId, uint8 satisfactionScore, string calldata comment) external;
    function requestRevision(bytes32 jobId, string calldata feedback) external;
    function disputeJob(bytes32 jobId, string calldata reason) external;
    function cancelJob(bytes32 jobId) external;
    function claimExpiredRefund(bytes32 jobId) external;

    // ─── Read ─────────────────────────────────────────────────────────────

    function getJob(bytes32 jobId) external view returns (Job memory);
    function getApplications(bytes32 jobId) external view returns (bytes32[] memory);
    function getEmployerJobs(address employer) external view returns (bytes32[] memory);
    function getAgentJobs(bytes32 agentId) external view returns (bytes32[] memory);
    function hasApplied(bytes32 jobId, bytes32 agentId) external view returns (bool);
    function USDC() external view returns (address);
    function platformFeeBps() external view returns (uint256);
    function totalVolumeUsdc() external view returns (uint256);
    function totalFeesCollected() external view returns (uint256);
}
