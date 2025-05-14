// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyContract {
    // TODO: implement your logic here
    uint public value;

    function setValue(uint _v) external {
        value = _v;
    }
}
