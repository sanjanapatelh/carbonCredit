
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Carbon Credit ERC20 Token
/// @notice Mintable ERC20 used to represent carbon credits
contract CarbonCreditToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("CarbonCredit", "CC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Mint new carbon credits
    function mint(address to, uint256 amount) external {
        require(hasRole(MINTER_ROLE, msg.sender), "CCT: Not minter");
        _mint(to, amount);
    }
}
