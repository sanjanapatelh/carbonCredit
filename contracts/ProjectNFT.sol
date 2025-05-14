// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProjectNFT is ERC721, AccessControl, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    enum Status { Unverified, UnderReview, Verified }

    struct Project {
        Status status;
        string metadataURI;
    }

    // Mapping from token ID to Project
    mapping(uint256 => Project) private _projects;

    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string metadataURI);
    event ProjectUpdated(uint256 indexed projectId, string newMetadataURI);
    event ProjectVerified(uint256 indexed projectId);
    event Staked(address indexed validator, uint256 amount);
    event Unstaked(address indexed validator, uint256 amount);
    event Slashed(address indexed validator, uint256 amount);

    constructor() ERC721("Carbon Project NFT", "CPNFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VALIDATOR_ROLE, msg.sender);
    }

    function registerProject(address to, string memory metadataURI) 
        external 
        whenNotPaused 
        returns (uint256) 
    {
        _tokenIds.increment();
        uint256 newProjectId = _tokenIds.current();

        _safeMint(to, newProjectId);
        _projects[newProjectId] = Project({
            status: Status.Unverified,
            metadataURI: metadataURI
        });

        emit ProjectRegistered(newProjectId, to, metadataURI);
        return newProjectId;
    }

    function updateProjectMetadata(uint256 projectId, string memory newMetadataURI) 
        external 
        whenNotPaused 
    {
        require(_exists(projectId), "Project does not exist");
        require(ownerOf(projectId) == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 
                "Not authorized to update metadata");

        _projects[projectId].metadataURI = newMetadataURI;
        emit ProjectUpdated(projectId, newMetadataURI);
    }

    function verifyProjectStatus(uint256 projectId) 
        external 
        whenNotPaused 
        onlyRole(VALIDATOR_ROLE) 
    {
        require(_exists(projectId), "Project does not exist");
        _projects[projectId].status = Status.Verified;
        emit ProjectVerified(projectId);
    }

    function getProjectStatus(uint256 projectId) external view returns (Status) {
        require(_exists(projectId), "Project does not exist");
        return _projects[projectId].status;
    }

    function getProjectMetadata(uint256 projectId) external view returns (string memory) {
        require(_exists(projectId), "Project does not exist");
        return _projects[projectId].metadataURI;
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
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 