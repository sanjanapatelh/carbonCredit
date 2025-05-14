// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./ProjectNFT.sol";

contract CarbonToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    ProjectNFT public projectNFT;

    // Mapping to track if a project has been minted
    mapping(uint256 => bool) private _projectMinted;
    // Mapping to track total minted amount per project
    mapping(uint256 => uint256) private _projectTotalMinted;

    // Events
    event CreditsMinted(uint256 indexed projectId, address indexed recipient, uint256 amount);
    event CreditsRetired(address indexed account, uint256 amount);
    event CreditsTransferred(address indexed from, address indexed to, uint256 amount);
    event Staked(address indexed validator, uint256 amount);
    event Unstaked(address indexed validator, uint256 amount);
    event Slashed(address indexed validator, uint256 amount);

    constructor(address _projectNFT) ERC20("Carbon Credit Token", "CCT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(VALIDATOR_ROLE, msg.sender);
        projectNFT = ProjectNFT(_projectNFT);
    }

    function mintCarbonCredits(
        uint256 projectId,
        address recipient,
        uint256 amount
    ) external whenNotPaused onlyRole(MINTER_ROLE) {
        require(!_projectMinted[projectId], "Project already minted");
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if project is verified
        ProjectNFT.Status status = projectNFT.getProjectStatus(projectId);
        require(status == ProjectNFT.Status.Verified, "Project not verified");

        _projectMinted[projectId] = true;
        _projectTotalMinted[projectId] = amount;
        _mint(recipient, amount);

        emit CreditsMinted(projectId, recipient, amount);
    }

    function retireCarbonCredits(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _burn(msg.sender, amount);
        emit CreditsRetired(msg.sender, amount);
    }

    function transferCarbonCredits(
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        bool success = super.transfer(to, amount);
        if (success) {
            emit CreditsTransferred(msg.sender, to, amount);
        }
        return success;
    }

    function getProjectMintedStatus(uint256 projectId) external view returns (bool) {
        return _projectMinted[projectId];
    }

    function getProjectTotalMinted(uint256 projectId) external view returns (uint256) {
        return _projectTotalMinted[projectId];
    }

    // Staking functionality (placeholder)
    function stake() external payable {
        require(msg.value > 0, "Must stake some ETH");
        emit Staked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Must unstake some ETH");
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    function slash(address validator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementation would include actual slashing logic
        emit Slashed(validator, 0);
    }

    // Pausable functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
} 