// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NooterToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) Ownable(msg.sender) {
        // Initial supply is minted to the deployer (contract owner)
        // Assuming 18 decimals, so multiply initialSupply by 10**18
        _mint(msg.sender, initialSupply * (10**uint256(decimals())));
    }
} 