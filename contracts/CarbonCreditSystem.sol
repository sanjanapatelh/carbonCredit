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
    event ValidatorRegistered(address indexed validator, uint256 initialStake);
    event ValidatorSlashed(address indexed validator, uint256 amountSlashed, uint256 newCredibility);

    constructor(CarbonCreditToken _token) {
        creditToken = _token;
        admin = payable(msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --------------------
    // Project Management
    // --------------------

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

    function updateProject(uint256 projectId, string calldata metadataURI) external {
        Project storage p = projects[projectId];
        require(p.owner == msg.sender, "CCS: Not owner");
        p.metadataURI = metadataURI;
        emit ProjectUpdated(projectId, metadataURI);
    }

    function requestValidation(uint256 projectId) external {
        Project storage p = projects[projectId];
        require(p.owner == msg.sender, "CCS: Not owner");
        p.status = Status.UnderReview;
        emit ValidationRequested(projectId);
    }

    // --------------------
    // Validator Management
    // --------------------

    /// @notice Validators self-register by staking ETH
    function registerValidator() external payable {
        require(!validators[msg.sender].registered, "CCS: Already validator");
        require(msg.value > 0, "CCS: Stake > 0");

        validators[msg.sender] = Validator({
            stake:       msg.value,
            credibility: 10_000,
            registered:  true
        });
        _grantRole(VALIDATOR_ROLE, msg.sender);
        emit ValidatorRegistered(msg.sender, msg.value);
    }

    /// @notice Validator tops up their stake
    function stake() external payable onlyRole(VALIDATOR_ROLE) {
        require(msg.value > 0, "CCS: Stake > 0");
        validators[msg.sender].stake += msg.value;
        emit ValidatorRegistered(msg.sender, validators[msg.sender].stake);
    }

    // --------------------
    // Validation Workflow
    // --------------------

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

    function finalizeValidation(uint256 projectId) external {
        Project storage p = projects[projectId];
        require(p.status == Status.UnderReview, "CCS: Not under review");

        address[] storage voters = responders[projectId];
        require(voters.length > 0, "CCS: No responses");

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

        creditToken.mint(p.owner, finalCredits);

        for (uint i; i < voters.length; i++) {
            address v     = voters[i];
            uint256 given = responses[projectId][v].credits;
            if (given != finalCredits) {
                uint256 slash = validators[v].stake / 3;
                validators[v].stake -= slash;

                uint256 error = (given > finalCredits)
                    ? given - finalCredits
                    : finalCredits - given;
                uint256 penaltyBP = (error * 10_000) / finalCredits;
                if (penaltyBP >= validators[v].credibility) {
                    validators[v].credibility = 0;
                } else {
                    validators[v].credibility -= penaltyBP;
                }

                admin.transfer(slash);
                emit ValidatorSlashed(v, slash, validators[v].credibility);
            }
            delete responses[projectId][v];
        }
        delete responders[projectId];

        p.status = Status.Verified;
        emit ValidationFinalized(projectId, finalCredits);
    }
}
