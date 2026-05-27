// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAgentRegistry.sol";
import "./interfaces/IJobRegistry.sol";
import "./interfaces/IReputationOracle.sol";

/**
 * @title  Marketplace
 * @notice AI Job Board platform hub — configuration root, stats aggregator,
 *         and featured-listing manager for the Arc AI Job Board.
 *
 * @dev    Acts as the single source of truth for contract addresses.
 *         The frontend reads contract addresses from this contract so only
 *         one address (Marketplace) needs to be hardcoded in the dApp.
 *
 *         Responsibilities:
 *           - Contract address registry  (getAddresses)
 *           - Platform statistics        (PlatformStats)
 *           - Featured agent/job slots   (up to 10 each)
 *           - Emergency pause flag
 *           - Platform fee configuration (mirrors JobRegistry.platformFeeBps)
 */
contract Marketplace is Ownable {
    // ═══════════════════════════════════════════════════════════════════════
    //  STRUCTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Snapshot of global platform activity.
    struct PlatformStats {
        uint256 totalJobs;
        uint256 openJobs;
        uint256 completedJobs;
        uint256 disputedJobs;
        uint256 totalAgents;
        uint256 verifiedAgents;
        uint256 totalVolumeUsdc;    // 6 decimals
        uint256 totalFeesCollected; // 6 decimals
        uint256 lastUpdated;
    }

    /// @notice A featured agent slot on the homepage.
    struct FeaturedAgent {
        bytes32 agentId;
        uint256 featuredUntil;      // Unix timestamp
        string  tagline;
    }

    /// @notice A featured job slot on the homepage.
    struct FeaturedJob {
        bytes32 jobId;
        uint256 featuredUntil;
    }

    /// @notice Address registry for all protocol contracts.
    struct ContractAddresses {
        address agentRegistry;
        address jobRegistry;
        address reputationOracle;
        address usdc;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice USDC on Arc Testnet
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    /// @notice Maximum featured slots per category
    uint256 public constant MAX_FEATURED = 10;

    // ═══════════════════════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Protocol contract references
    IAgentRegistry    public agentRegistry;
    IJobRegistry      public jobRegistry;
    IReputationOracle public reputationOracle;

    /// @dev Platform statistics (admin-updated)
    PlatformStats private _stats;

    /// @dev Featured listings
    FeaturedAgent[] private _featuredAgents;
    FeaturedJob[]   private _featuredJobs;

    /// @dev Emergency pause (e.g. critical bug discovered)
    bool public paused;

    /// @dev Human-readable platform name for dApp display
    string public platformName = "Arc AI Job Board";

    /// @dev Platform description
    string public platformDescription =
        "Decentralised AI agent job marketplace powered by ERC-8004 & ERC-8183 on Arc.";

    // ═══════════════════════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event ContractUpdated(string indexed name, address newAddress);
    event AgentFeatured(bytes32 indexed agentId, uint256 featuredUntil, string tagline);
    event JobFeatured(bytes32 indexed jobId, uint256 featuredUntil);
    event FeaturedRemoved(string indexed category, uint256 index);
    event StatsUpdated(uint256 totalJobs, uint256 totalAgents, uint256 totalVolumeUsdc);
    event PlatformPaused(bool paused);
    event PlatformNameUpdated(string newName);

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param _agentRegistry    Deployed AgentRegistry
     * @param _jobRegistry      Deployed JobRegistry
     * @param _reputationOracle Deployed ReputationOracle
     */
    constructor(
        address _agentRegistry,
        address _jobRegistry,
        address _reputationOracle
    ) {
        agentRegistry    = IAgentRegistry(_agentRegistry);
        jobRegistry      = IJobRegistry(_jobRegistry);
        reputationOracle = IReputationOracle(_reputationOracle);

        _stats.lastUpdated = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ — Contract Registry
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Return all protocol contract addresses in a single call.
     * @dev    Frontend bootstraps from this to avoid multiple env vars.
     * @return ContractAddresses struct
     */
    function getAddresses() external view returns (ContractAddresses memory) {
        return ContractAddresses({
            agentRegistry  : address(agentRegistry),
            jobRegistry    : address(jobRegistry),
            reputationOracle: address(reputationOracle),
            usdc           : USDC
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ — Statistics
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Read the cached platform statistics snapshot.
     * @dev    Updated by admin via syncStats() or manually via updateStats().
     * @return PlatformStats struct
     */
    function getPlatformStats() external view returns (PlatformStats memory) {
        return _stats;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  READ — Featured Listings
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Return current featured agents (including expired ones).
     *         Use pruneExpiredFeatured() to clean up stale entries first.
     */
    function getFeaturedAgents() external view returns (FeaturedAgent[] memory) {
        return _featuredAgents;
    }

    /**
     * @notice Return current featured jobs.
     */
    function getFeaturedJobs() external view returns (FeaturedJob[] memory) {
        return _featuredJobs;
    }

    /**
     * @notice Return platform info for dApp display.
     */
    function getPlatformInfo() external view returns (
        string memory name,
        string memory description,
        bool          isPaused,
        uint256       chainId
    ) {
        return (platformName, platformDescription, paused, block.chainid);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Admin: Statistics
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Sync statistics from on-chain contract state.
     * @dev    Reads live data from AgentRegistry and JobRegistry.
     *         Any frontend can call this; actual stats come from the contracts.
     */
    function syncStats() external {
        // Read live volume from JobRegistry
        uint256 volume = jobRegistry.totalVolumeUsdc();
        uint256 fees   = jobRegistry.totalFeesCollected();

        _stats.totalVolumeUsdc    = volume;
        _stats.totalFeesCollected = fees;
        _stats.lastUpdated        = block.timestamp;

        emit StatsUpdated(_stats.totalJobs, _stats.totalAgents, volume);
    }

    /**
     * @notice Manually update stats counters (for off-chain indexed data).
     * @dev    Called by admin after off-chain indexer batches results.
     */
    function updateStats(
        uint256 totalJobs,
        uint256 openJobs,
        uint256 completedJobs,
        uint256 disputedJobs,
        uint256 totalAgents,
        uint256 verifiedAgents
    ) external onlyOwner {
        _stats.totalJobs      = totalJobs;
        _stats.openJobs       = openJobs;
        _stats.completedJobs  = completedJobs;
        _stats.disputedJobs   = disputedJobs;
        _stats.totalAgents    = totalAgents;
        _stats.verifiedAgents = verifiedAgents;
        _stats.lastUpdated    = block.timestamp;

        emit StatsUpdated(totalJobs, totalAgents, _stats.totalVolumeUsdc);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Admin: Featured Listings
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Add an agent to the featured slot.
     *
     * @param agentId       ERC-8004 agentId to feature
     * @param durationDays  Number of days to keep featured
     * @param tagline       Short promotional description (≤ 80 chars)
     */
    function featureAgent(
        bytes32        agentId,
        uint256        durationDays,
        string calldata tagline
    ) external onlyOwner {
        require(_featuredAgents.length < MAX_FEATURED, "Marketplace: featured agents full");
        require(durationDays > 0 && durationDays <= 365, "Marketplace: invalid duration");

        uint256 until = block.timestamp + (durationDays * 1 days);
        _featuredAgents.push(FeaturedAgent({ agentId: agentId, featuredUntil: until, tagline: tagline }));

        emit AgentFeatured(agentId, until, tagline);
    }

    /**
     * @notice Add a job to the featured slot.
     *
     * @param jobId        Job identifier to feature
     * @param durationDays Duration in days
     */
    function featureJob(bytes32 jobId, uint256 durationDays) external onlyOwner {
        require(_featuredJobs.length < MAX_FEATURED, "Marketplace: featured jobs full");
        require(durationDays > 0 && durationDays <= 365, "Marketplace: invalid duration");

        uint256 until = block.timestamp + (durationDays * 1 days);
        _featuredJobs.push(FeaturedJob({ jobId: jobId, featuredUntil: until }));

        emit JobFeatured(jobId, until);
    }

    /**
     * @notice Remove a featured agent by index.
     * @param index  Index in _featuredAgents array
     */
    function removeFeaturedAgent(uint256 index) external onlyOwner {
        require(index < _featuredAgents.length, "Marketplace: invalid index");
        _featuredAgents[index] = _featuredAgents[_featuredAgents.length - 1];
        _featuredAgents.pop();
        emit FeaturedRemoved("agent", index);
    }

    /**
     * @notice Remove a featured job by index.
     * @param index  Index in _featuredJobs array
     */
    function removeFeaturedJob(uint256 index) external onlyOwner {
        require(index < _featuredJobs.length, "Marketplace: invalid index");
        _featuredJobs[index] = _featuredJobs[_featuredJobs.length - 1];
        _featuredJobs.pop();
        emit FeaturedRemoved("job", index);
    }

    /**
     * @notice Sweep expired featured listings in one transaction.
     * @dev    Anyone may call this to keep the featured lists clean.
     */
    function pruneExpiredFeatured() external {
        uint256 i = 0;
        while (i < _featuredAgents.length) {
            if (_featuredAgents[i].featuredUntil <= block.timestamp) {
                emit FeaturedRemoved("agent", i);
                _featuredAgents[i] = _featuredAgents[_featuredAgents.length - 1];
                _featuredAgents.pop();
            } else {
                unchecked { i++; }
            }
        }
        i = 0;
        while (i < _featuredJobs.length) {
            if (_featuredJobs[i].featuredUntil <= block.timestamp) {
                emit FeaturedRemoved("job", i);
                _featuredJobs[i] = _featuredJobs[_featuredJobs.length - 1];
                _featuredJobs.pop();
            } else {
                unchecked { i++; }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  WRITE — Admin: Configuration
    // ═══════════════════════════════════════════════════════════════════════

    function setAgentRegistry(address addr) external onlyOwner {
        require(addr != address(0), "Marketplace: zero address");
        agentRegistry = IAgentRegistry(addr);
        emit ContractUpdated("AgentRegistry", addr);
    }

    function setJobRegistry(address addr) external onlyOwner {
        require(addr != address(0), "Marketplace: zero address");
        jobRegistry = IJobRegistry(addr);
        emit ContractUpdated("JobRegistry", addr);
    }

    function setReputationOracle(address addr) external onlyOwner {
        require(addr != address(0), "Marketplace: zero address");
        reputationOracle = IReputationOracle(addr);
        emit ContractUpdated("ReputationOracle", addr);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PlatformPaused(_paused);
    }

    function setPlatformName(string calldata newName) external onlyOwner {
        platformName = newName;
        emit PlatformNameUpdated(newName);
    }
}

