// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {EURToken} from "../src/EURToken.sol";

/**
 * @title DeployEURToken
 * @notice Script de deploy para EURToken
 */
contract DeployEURToken is Script {
    EURToken public eurt;
    uint256 public constant INITIAL_MINT = 1_000_000 * 10 ** 6; // 1M EURT

    function run() external returns (EURToken) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy EURToken
        eurt = new EURToken(deployer);
        console.log("EURToken deployed at:", address(eurt));

        // Mint tokens iniciales al deployer
        eurt.mint(deployer, INITIAL_MINT);
        console.log("Minted", INITIAL_MINT / 10 ** 6, "EURT to deployer:", deployer);

        vm.stopBroadcast();

        return eurt;
    }
}

