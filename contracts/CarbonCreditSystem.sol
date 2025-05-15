// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CarbonCreditToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title Carbon Credit Validation & Issuance System
/// @notice Manages projects, validators, staking, credibility, and credit minting
contract CarbonCreditSystem is AccessControl {
    using Counters for Counters.Counter;

    CarbonCreditToken public immutable creditToken;
    address payable   public admin;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    enum Status { Unverified, UnderReview, Verified }
    struct Project {
        address owner;
        Status  status;
        string  metadataURI;
    }

    struct Validator {
        uint256 stake;        // in wei
        uint256 credibility;  // basis points (10_000 = 100%)
        bool    registered;
    }

    struct Response {
        uint256 credits;      // estimate
        bool    responded;
    }

    Counters.Counter private _projectIds;
    mapping(uint256 => Project)                            public projects;
    mapping(uint256 => mapping(address => Response))       public responses;
    mapping(uint256 => address[])                          public responders;
    mapping(address => Validator)                          public validators;

    event ProjectCreated(uint256 indexed projectId, address indexed owner, string metadataURI);
    event ProjectUpdated(uint256 indexed projectId, string metadataURI);
    event ValidationRequested(uint256 indexed projectId);
    event ValidatorResponded(uint256 indexed projectId, address indexed validator, uint256 credits);
    event ValidationFinalized(uint256 indexed projectId, uint256 finalCredits);
    event ValidatorAdded(address indexed validator, uint256 initialStake);
    event ValidatorSlashed(address indexed validator, uint256 amountSlashed, uint256 newCredibility);

    constructor(CarbonCreditToken _token) {
        creditToken = _token;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Give this system contract the ability to mint credits:
        // creditToken.grantRole(_token.MINTER_ROLE(), address(this));
    }

    // --------------------
    // Project Management
    // --------------------

    /// @notice Create a new project record
    function createProject(string calldata metadataURI) external returns (uint256) {
        _projectIds.increment();
        uint256 pid = _projectIds.current();
        projects[pid] = Project({
            owner:       msg.sender,
            status:      Status.Unverified,
            metadataURI: metadataURI
        });
        emit ProjectCreated(pid, msg.sender, metadataURI);
        return pid;
    }

    /// @notice Owner can update their project metadata
    function updateProject(uint256 projectId, string calldata metadataURI) external {
        Project storage p = projects[projectId];
        require(p.owner == msg.sender, "CCS: Not owner");
        p.metadataURI = metadataURI;
        emit ProjectUpdated(projectId, metadataURI);
    }

    /// @notice Owner requests validation
    function requestValidation(uint256 projectId) external {
        Project storage p = projects[projectId];
        require(p.owner == msg.sender, "CCS: Not owner");
        p.status = Status.UnderReview;
        emit ValidationRequested(projectId);
    }

    // --------------------
    // Validator Management
    // --------------------

    /// @notice Admin adds a validator and stakes ETH
    function addValidator(address v) external payable onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!validators[v].registered, "CCS: Already validator");
        require(msg.value > 0, "CCS: Stake > 0");
        validators[v] = Validator({
            stake:       msg.value,
            credibility: 10_000,
            registered:  true
        });
        _grantRole(VALIDATOR_ROLE, v);
        emit ValidatorAdded(v, msg.value);
    }

    /// @notice Validator tops up their stake
    function stake() external payable onlyRole(VALIDATOR_ROLE) {
        require(msg.value > 0, "CCS: Stake > 0");
        validators[msg.sender].stake += msg.value;
        emit ValidatorAdded(msg.sender, validators[msg.sender].stake);
    }

    // --------------------
    // Validation Workflow
    // --------------------

    /// @notice Validator responds with a credits estimate
    function respondValidation(uint256 projectId, uint256 credits) external onlyRole(VALIDATOR_ROLE) {
        Project storage p = projects[projectId];
        require(p.status == Status.UnderReview, "CCS: Not under review");
        Response storage r = responses[projectId][msg.sender];
        require(!r.responded, "CCS: Already responded");
        r.credits   = credits;
        r.responded = true;
        responders[projectId].push(msg.sender);
        emit ValidatorResponded(projectId, msg.sender, credits);
    }

    /// @notice Anyone can finalize once validators have responded
    function finalizeValidation(uint256 projectId) external {
        Project storage p = projects[projectId];
        require(p.status == Status.UnderReview, "CCS: Not under review");

        address[] storage voters = responders[projectId];
        require(voters.length > 0, "CCS: No responses");

        // Compute weighted average
        uint256 weightSum;
        uint256 weightedTotal;
        for (uint i; i < voters.length; i++) {
            address v = voters[i];
            uint256 w = validators[v].credibility;
            uint256 c = responses[projectId][v].credits;
            weightSum     += w;
            weightedTotal += c * w;
        }
        uint256 finalCredits = weightedTotal / weightSum;

        // Mint ERC-20 to project owner
        creditToken.mint(p.owner, finalCredits);

        // Slash deviators
        for (uint i; i < voters.length; i++) {
            address v     = voters[i];
            uint256 given = responses[projectId][v].credits;
            if (given != finalCredits) {
                // slash 1/3 of stake
                uint256 slash = validators[v].stake / 3;
                validators[v].stake -= slash;

                // reduce credibility by relative error in basis points
                uint256 error = (given > finalCredits)
                    ? given - finalCredits
                    : finalCredits - given;
                uint256 penaltyBP = (error * 10_000) / finalCredits;
                if (penaltyBP >= validators[v].credibility) {
                    validators[v].credibility = 0;
                } else {
                    validators[v].credibility -= penaltyBP;
                }

                // send slashed ETH to admin
                admin.transfer(slash);
                emit ValidatorSlashed(v, slash, validators[v].credibility);
            }
            // reset for next round
            delete responses[projectId][v];
        }
        delete responders[projectId];

        // mark as verified
        p.status = Status.Verified;
        emit ValidationFinalized(projectId, finalCredits);
    }
}
