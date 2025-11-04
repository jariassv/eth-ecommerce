// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockEURToken
 * @dev Mock del contrato EURToken para tests del oráculo
 */
contract MockEURToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("EUR Token", "EURT") Ownable(initialOwner) {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

