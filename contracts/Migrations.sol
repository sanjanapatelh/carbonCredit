// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Migrations {
    address public owner;
    uint    public last_completed_migration;

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == owner, "unauthorized");
        _;
    }

    function setCompleted(uint completed) external restricted {
        last_completed_migration = completed;
    }
}
