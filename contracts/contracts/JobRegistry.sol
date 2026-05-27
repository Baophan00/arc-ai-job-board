// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IAgentRegistry.sol";
import "./interfaces/IJobRegistry.sol";
import "./interfaces/IReputationOracle.sol";

/**
 * @title  JobRegistry
 * @notice ERC-8183 AI Agent Job Escrow & Settlement Contract.
 *
 * @dev    Manages the full lifecycle of AI agent jobs on Arc:
 *
 *           1. Employer creates a job with USDC escrow
 *           2. Agents apply; employer assigns one
 *           3. Agent starts work, submits deliverable
 *           4. Employer approves → USDC released, reputation updated
 *              OR employer requests revision → back to InProgress
 *              OR dispute raised → owner resolves
 *
 *         Platform fee: 2.5% on completion (paid by employer, deducted from escrow).
 *
 *         ┌─────────────────────────────────────────────────────────────┐
 *         │  Arc Testnet USDC: 0x3600000000000000000000000000000000000000│
 *         │  6 decimals  ·  native gas token on Arc                     │
 *         └─────────────────────────────────────────────────────────────┘
 *
 *         ERC-8183 spec: https://docs.arc.io/build/agentic-economy
 */
contract JobRegistry is IJobRegistry, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters  for Counters.Counter;

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice USDC on Arc Testnet (ERC-20, 6 decimals)
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    /// @notice Maximum applicants per job (anti-spam)
    uint256 public constant MAX_APPLICANTS = 20;

    /// @notice Minimum job budget: 1 USDC
    uint256 public constant MIN_BUDGET = 1e6;

    /// @notice Basis-point denominator (10 000 = 100%)
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // ═══════════════════════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice ERC-8004 AgentRegistry (immutable after deployment)
    IAgentRegistry public immutable agentRegistry;

    /// @notice ERC-8004 ReputationOracle (updatable by owner)
    IReputationOracle public reputationOracle;

    /// @notice Platform fee in basis points (default 250 = 2.5%)
    uint256 public platformFeeBps = 250;

    /// @notice Address receiving platform fees
    address public feeRecipient;

    /// @dev Job counter for deterministic ID generation
    Counters.Counter private _jobCounter;

    /// @dev jobId → Job
    mapping(bytes32 => Job) private _jobs;

    /// @dev jobId → applicant agentId list
    mapping(bytes32 => bytes32[]) private _applications;

    /// @dev jobId → agentId → hasApplied
    mapping(bytes32 => mapping(bytes32 => bool)) private _hasApplied;

    /// @dev employer address → jobId list
    mapping(address => bytes32[]) private _employerJobs;

    /// @dev agentId → jobId list (assigned or completed)
    mapping(bytes32 => bytes32[]) private _agentJobs;

    /// @notice Cumulative USDC volume settled
    uint256 public totalVolumeUsdc;

    /// @notice Cumulative platform fees collected
    uint256 public totalFeesCollected;

    // ═══════════════════════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event JobCreated(
        bytes32 indexed jobId,
        address indexed employer,
        uint256         budget,
        string          title
    );
    event AgentApplied(
        bytes32 indexed jobId,
        bytes32 indexed agentId,
        address         wallet
    );
    event ApplicationWithdrawn(bytes32 indexed jobId, bytes32 indexed agentId);
    event AgentAssigned(bytes32 indexed jobId, bytes32 indexed agentId);
    event JobStarted(bytes32 indexed jobId, bytes32 indexed agentId);
    event DeliverableSubmitted(
        bytes32 indexed jobId,
        bytes32 indexed agentId,
        string          deliverableURI
    );
    event RevisionRequested(bytes32 indexed jobId, string feedback);
    event JobCompleted(
        bytes32 indexed jobId,
        bytes32 indexed agentId,
        uint256         agentPayment,
        uint256         platformFee
    );
    event JobDisputed(
        bytes32 indexed jobId,
        address indexed initiator,
        string          reason
    );
    event DisputeResolved(
        bytes32 indexed jobId,
        uint256         agentPayment,
        uint256         employerRefund
    );
    event JobCancelled(bytes32 indexed jobId, address indexed initiator);
    event PlatformFeeUpdated(uint256 oldBps, uint256 newBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // ═══════════════════════════════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error JobNotFound(bytes32 jobId);
    error InvalidStatus(JobStatus current, JobStatus required);
    error NotEmployer(address caller);
    error NotAssignedAgent(bytes32 agentId);
    error NotRegisteredAgent();
    error AlreadyApplied(bytes32 agentId, bytes32 jobId);
    error ApplicationsFull(bytes32 jobId);
    error BudgetTooLow(uint256 budget, uint256 minimum);
    error DeadlineInPast(uint256 deadline);
    error DeadlineNotReached(uint256 deadline, uint256 current);
    error InvalidFeeBps(uint256 bps);
    error InvalidAgentShareBps(uint256 bps);
    error InvalidScore(uint8 score);

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param _agentRegistry     Deployed AgentRegistry address
     * @param _reputationOracle  Deployed ReputationOracle address (or zero to skip)
     * @param _feeRecipient      Address to collect platform fees
     */
    constructor(
        address _agentRegistry,
        address _reputationOracle,
        address _feeRecipient
    ) {
        require(_agentRegistry != address(0), "JobRegistry: zero agentRegistry");
        require(_feeRecipient  != address(0), "JobRegistry: zero feeRecipient");
        agentRegistry    = IAgentRegistry(_agentRegistry);
        reputationOracle = IReputationOracle(_reputationOracle);
        feeRecipient     = _feeRecipient;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Employer Flows
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Post a new job and deposit USDC budget into escrow.
     *
     * @dev    Calls IERC20.transferFrom — the employer must first approve
     *         this contract for at least `budget` USDC.
     *
     *         Platform fee is locked at creation time to prevent fee-change
     *         manipulation after posting.
     *
     * @param title            Short job title (≤ 100 chars recommended)
     * @param description      Detailed job description
     * @param requiredSkills   Skills the agent must possess
     * @param budget           USDC amount (6 decimals) paid to the agent
     * @param deadline         Unix timestamp after which the employer can refund
     * @param jobURI           IPFS/HTTPS URI for extended job details
     *
     * @return jobId  Unique job identifier
     */
    function createJob(
        string    calldata title,
        string    calldata description,
        string[]  calldata requiredSkills,
        uint256   budget,
        uint256   deadline,
        string    calldata jobURI
    ) external override nonReentrant returns (bytes32 jobId) {
        if (budget < MIN_BUDGET)            revert BudgetTooLow(budget, MIN_BUDGET);
        if (deadline <= block.timestamp)    revert DeadlineInPast(deadline);

        // Deterministic collision-resistant jobId
        _jobCounter.increment();
        jobId = keccak256(abi.encodePacked(
            msg.sender,
            _jobCounter.current(),
            block.timestamp
        ));

        // Pull USDC into escrow
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), budget);

        // Lock platform fee at creation (prevents manipulation after posting)
        uint256 fee = (budget * platformFeeBps) / BPS_DENOMINATOR;

        _jobs[jobId] = Job({
            jobId         : jobId,
            employer      : msg.sender,
            assignedAgent : bytes32(0),
            title         : title,
            description   : description,
            requiredSkills: requiredSkills,
            budget        : budget,
            deadline      : deadline,
            status        : JobStatus.Open,
            deliverableURI: "",
            jobURI        : jobURI,
            platformFee   : fee,
            createdAt     : block.timestamp,
            completedAt   : 0
        });

        _employerJobs[msg.sender].push(jobId);

        emit JobCreated(jobId, msg.sender, budget, title);
    }

    /**
     * @notice Assign a specific applicant agent to the job.
     *
     * @dev  Only the employer. The agent must have applied.
     *       Open → Assigned.
     *
     * @param jobId    Job identifier
     * @param agentId  ERC-8004 agentId of the chosen agent
     */
    function assignAgent(bytes32 jobId, bytes32 agentId) external override {
        Job storage job = _requireJob(jobId);
        if (job.employer != msg.sender)      revert NotEmployer(msg.sender);
        _requireStatus(job, JobStatus.Open);
        require(_hasApplied[jobId][agentId], "JobRegistry: agent has not applied");

        job.assignedAgent = agentId;
        job.status        = JobStatus.Assigned;

        _agentJobs[agentId].push(jobId);
        emit AgentAssigned(jobId, agentId);
    }

    /**
     * @notice Approve submitted deliverable and release payment.
     *
     * @dev  Releases (budget − platformFee) USDC to the agent's wallet.
     *       Sends platformFee to feeRecipient.
     *       Calls AgentRegistry.incrementJobsCompleted() and
     *       ReputationOracle.submitFeedback().
     *       Submitted → Completed.
     *
     * @param jobId              Job identifier
     * @param satisfactionScore  Employer rating 1–5
     * @param feedbackComment    Optional comment recorded in ReputationOracle
     */
    function approveWork(
        bytes32        jobId,
        uint8          satisfactionScore,
        string calldata feedbackComment
    ) external override nonReentrant {
        if (satisfactionScore < 1 || satisfactionScore > 5) revert InvalidScore(satisfactionScore);

        Job storage job = _requireJob(jobId);
        if (job.employer != msg.sender) revert NotEmployer(msg.sender);
        _requireStatus(job, JobStatus.Submitted);

        bytes32 agentId    = job.assignedAgent;
        uint256 fee        = job.platformFee;
        uint256 agentPay   = job.budget - fee;
        address agentWallet = agentRegistry.getAgent(agentId).wallet;

        // State changes before external calls (CEI pattern)
        job.status      = JobStatus.Completed;
        job.completedAt = block.timestamp;
        totalVolumeUsdc    += job.budget;
        totalFeesCollected += fee;

        // Transfer to agent
        IERC20(USDC).safeTransfer(agentWallet, agentPay);

        // Transfer platform fee
        if (fee > 0) {
            IERC20(USDC).safeTransfer(feeRecipient, fee);
        }

        // Update on-chain stats via AgentRegistry oracle
        agentRegistry.incrementJobsCompleted(agentId);

        // Submit feedback to ReputationOracle (non-blocking)
        if (address(reputationOracle) != address(0)) {
            try reputationOracle.submitFeedback(agentId, jobId, satisfactionScore, feedbackComment) {}
            catch {}
        }

        emit JobCompleted(jobId, agentId, agentPay, fee);
    }

    /**
     * @notice Request changes from the agent.
     *
     * @dev Submitted → InProgress. The agent resubmits via submitDeliverable().
     *
     * @param jobId     Job identifier
     * @param feedback  Description of required changes
     */
    function requestRevision(bytes32 jobId, string calldata feedback) external override {
        Job storage job = _requireJob(jobId);
        if (job.employer != msg.sender) revert NotEmployer(msg.sender);
        _requireStatus(job, JobStatus.Submitted);

        job.status = JobStatus.InProgress;
        emit RevisionRequested(jobId, feedback);
    }

    /**
     * @notice Cancel a job before work has started and refund the employer.
     *
     * @dev Only callable in Open or Assigned status (before InProgress).
     *      Returns full budget to employer.
     *
     * @param jobId  Job identifier
     */
    function cancelJob(bytes32 jobId) external override nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.employer != msg.sender) revert NotEmployer(msg.sender);
        require(
            job.status == JobStatus.Open || job.status == JobStatus.Assigned,
            "JobRegistry: cannot cancel after work has started"
        );

        uint256 refund = job.budget;
        job.status     = JobStatus.Cancelled;

        IERC20(USDC).safeTransfer(msg.sender, refund);
        emit JobCancelled(jobId, msg.sender);
    }

    /**
     * @notice Claim a full refund once the deadline has passed.
     *
     * @dev Callable by employer if deadline exceeded and job not completed.
     *      Status must be Open, Assigned, or InProgress.
     *
     * @param jobId  Job identifier
     */
    function claimExpiredRefund(bytes32 jobId) external override nonReentrant {
        Job storage job = _requireJob(jobId);
        if (job.employer != msg.sender)        revert NotEmployer(msg.sender);
        if (block.timestamp <= job.deadline)   revert DeadlineNotReached(job.deadline, block.timestamp);
        require(
            job.status == JobStatus.Open ||
            job.status == JobStatus.Assigned ||
            job.status == JobStatus.InProgress,
            "JobRegistry: job is not in an active state"
        );

        uint256 refund = job.budget;
        job.status     = JobStatus.Cancelled;

        IERC20(USDC).safeTransfer(msg.sender, refund);
        emit JobCancelled(jobId, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Agent Flows
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Apply for an open job.
     *
     * @dev    msg.sender must be registered in AgentRegistry.
     *         Adds the caller's agentId to the applicant list.
     *         Maximum MAX_APPLICANTS applications per job.
     *
     * @param jobId  Job identifier
     */
    function applyForJob(bytes32 jobId) external override {
        Job storage job = _requireJob(jobId);
        _requireStatus(job, JobStatus.Open);

        // Resolve caller's agentId — reverts if not registered
        IAgentRegistry.Agent memory agent;
        try agentRegistry.getAgentByWallet(msg.sender) returns (IAgentRegistry.Agent memory a) {
            agent = a;
        } catch {
            revert NotRegisteredAgent();
        }

        bytes32 agentId = agent.agentId;
        if (_hasApplied[jobId][agentId])              revert AlreadyApplied(agentId, jobId);
        if (_applications[jobId].length >= MAX_APPLICANTS) revert ApplicationsFull(jobId);

        _applications[jobId].push(agentId);
        _hasApplied[jobId][agentId] = true;

        emit AgentApplied(jobId, agentId, msg.sender);
    }

    /**
     * @notice Withdraw a previously submitted application.
     *
     * @dev Only possible while the job is still Open and the agent has not
     *      been assigned yet.
     *
     * @param jobId  Job identifier
     */
    function withdrawApplication(bytes32 jobId) external override {
        Job storage job = _requireJob(jobId);
        _requireStatus(job, JobStatus.Open);

        IAgentRegistry.Agent memory agent;
        try agentRegistry.getAgentByWallet(msg.sender) returns (IAgentRegistry.Agent memory a) {
            agent = a;
        } catch {
            revert NotRegisteredAgent();
        }

        bytes32 agentId = agent.agentId;
        require(_hasApplied[jobId][agentId], "JobRegistry: no application found");

        // Swap-and-pop removal
        bytes32[] storage apps = _applications[jobId];
        for (uint256 i = 0; i < apps.length; i++) {
            if (apps[i] == agentId) {
                apps[i] = apps[apps.length - 1];
                apps.pop();
                break;
            }
        }
        _hasApplied[jobId][agentId] = false;

        emit ApplicationWithdrawn(jobId, agentId);
    }

    /**
     * @notice Confirm acceptance of the job and mark it as InProgress.
     *
     * @dev Only the assigned agent. Assigned → InProgress.
     *
     * @param jobId  Job identifier
     */
    function startJob(bytes32 jobId) external override {
        Job storage job = _requireJob(jobId);
        _requireStatus(job, JobStatus.Assigned);

        IAgentRegistry.Agent memory agent;
        try agentRegistry.getAgentByWallet(msg.sender) returns (IAgentRegistry.Agent memory a) {
            agent = a;
        } catch {
            revert NotRegisteredAgent();
        }

        if (job.assignedAgent != agent.agentId) revert NotAssignedAgent(agent.agentId);

        job.status = JobStatus.InProgress;
        emit JobStarted(jobId, agent.agentId);
    }

    /**
     * @notice Submit deliverable for the employer's review.
     *
     * @dev Only the assigned agent. InProgress → Submitted.
     *
     * @param jobId          Job identifier
     * @param deliverableURI IPFS/HTTPS URI to the delivered work
     */
    function submitDeliverable(bytes32 jobId, string calldata deliverableURI) external override {
        Job storage job = _requireJob(jobId);
        _requireStatus(job, JobStatus.InProgress);

        IAgentRegistry.Agent memory agent;
        try agentRegistry.getAgentByWallet(msg.sender) returns (IAgentRegistry.Agent memory a) {
            agent = a;
        } catch {
            revert NotRegisteredAgent();
        }

        if (job.assignedAgent != agent.agentId) revert NotAssignedAgent(agent.agentId);

        job.deliverableURI = deliverableURI;
        job.status         = JobStatus.Submitted;

        emit DeliverableSubmitted(jobId, agent.agentId, deliverableURI);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Dispute
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Raise a dispute. Either the employer or assigned agent may call.
     *
     * @dev Status must be InProgress or Submitted.
     *      Owner resolves via resolveDispute().
     *
     * @param jobId   Job identifier
     * @param reason  Human-readable dispute reason (stored as event data)
     */
    function disputeJob(bytes32 jobId, string calldata reason) external override {
        Job storage job = _requireJob(jobId);

        bool isEmployer = (job.employer == msg.sender);
        bool isAgent    = false;
        if (job.assignedAgent != bytes32(0)) {
            try agentRegistry.getAgent(job.assignedAgent) returns (IAgentRegistry.Agent memory a) {
                isAgent = (a.wallet == msg.sender);
            } catch {}
        }
        require(isEmployer || isAgent, "JobRegistry: caller is not a job party");
        require(
            job.status == JobStatus.InProgress || job.status == JobStatus.Submitted,
            "JobRegistry: cannot dispute in current status"
        );

        job.status = JobStatus.Disputed;
        emit JobDisputed(jobId, msg.sender, reason);
    }

    /**
     * @notice Resolve a dispute by splitting the escrowed budget.
     *
     * @dev Only the contract owner (platform arbitrator).
     *      `agentShareBps` = agent's share in basis points.
     *        0      → full refund to employer
     *        10_000 → full payment to agent
     *      Platform fee is waived in dispute resolution.
     *
     * @param jobId          Job identifier
     * @param agentShareBps  Agent's share (0–10_000)
     */
    function resolveDispute(
        bytes32 jobId,
        uint256 agentShareBps
    ) external onlyOwner nonReentrant {
        if (agentShareBps > BPS_DENOMINATOR) revert InvalidAgentShareBps(agentShareBps);

        Job storage job = _requireJob(jobId);
        _requireStatus(job, JobStatus.Disputed);

        uint256 agentPayment   = (job.budget * agentShareBps)                    / BPS_DENOMINATOR;
        uint256 employerRefund = job.budget - agentPayment;

        job.status      = JobStatus.Resolved;
        job.completedAt = block.timestamp;

        address agentWallet = agentRegistry.getAgent(job.assignedAgent).wallet;

        if (agentPayment > 0)   IERC20(USDC).safeTransfer(agentWallet,  agentPayment);
        if (employerRefund > 0) IERC20(USDC).safeTransfer(job.employer, employerRefund);

        // Partial credit if agent received majority
        if (agentShareBps >= 5_000) {
            try agentRegistry.incrementJobsCompleted(job.assignedAgent) {} catch {}
        }

        emit DisputeResolved(jobId, agentPayment, employerRefund);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Update the platform fee (capped at 10%).
     * @param newFeeBps  New fee in basis points (max 1 000)
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > 1_000) revert InvalidFeeBps(newFeeBps);
        emit PlatformFeeUpdated(platformFeeBps, newFeeBps);
        platformFeeBps = newFeeBps;
    }

    /**
     * @notice Update the fee recipient.
     * @param newRecipient  New address for platform fees
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "JobRegistry: zero address");
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        feeRecipient = newRecipient;
    }

    /**
     * @notice Update the ReputationOracle contract.
     * @param newOracle  New oracle address (zero disables feedback)
     */
    function setReputationOracle(address newOracle) external onlyOwner {
        reputationOracle = IReputationOracle(newOracle);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ
    // ═══════════════════════════════════════════════════════════════════════

    function getJob(bytes32 jobId) external view override returns (Job memory) {
        return _requireJob(jobId);
    }

    function getApplications(bytes32 jobId) external view override returns (bytes32[] memory) {
        return _applications[jobId];
    }

    function getEmployerJobs(address employer) external view override returns (bytes32[] memory) {
        return _employerJobs[employer];
    }

    function getAgentJobs(bytes32 agentId) external view override returns (bytes32[] memory) {
        return _agentJobs[agentId];
    }

    function hasApplied(bytes32 jobId, bytes32 agentId) external view override returns (bool) {
        return _hasApplied[jobId][agentId];
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INTERNAL
    // ═══════════════════════════════════════════════════════════════════════

    function _requireJob(bytes32 jobId) internal view returns (Job storage) {
        require(_jobs[jobId].createdAt != 0, "JobRegistry: job not found");
        return _jobs[jobId];
    }

    function _requireStatus(Job storage job, JobStatus required) internal view {
        if (job.status != required) revert InvalidStatus(job.status, required);
    }
}
