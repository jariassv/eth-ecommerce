// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {USDToken} from "../src/USDToken.sol";

/**
 * @title DeployUSDToken
 * @notice Script de deploy para USDToken
 */
contract DeployUSDToken is Script {
    USDToken public usdt;
    uint256 public constant INITIAL_MINT = 1_000_000 * 10 ** 6; // 1M USDT

    function run() external returns (USDToken) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy USDToken
        usdt = new USDToken(deployer);
        console.log("USDToken deployed at:", address(usdt));

        // Mint tokens iniciales al deployer
        usdt.mint(deployer, INITIAL_MINT);
        console.log("Minted", INITIAL_MINT / 10 ** 6, "USDT to deployer:", deployer);

        vm.stopBroadcast();

        return usdt;
    }
}

