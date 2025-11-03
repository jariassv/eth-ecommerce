// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import "../src/Ecommerce.sol";

/**
 * @title DeployEcommerce
 * @notice Script de deploy para el contrato Ecommerce
 */
contract DeployEcommerce is Script {
    Ecommerce public ecommerce;
    
    function run() external returns (Ecommerce) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Dirección del contrato USDToken (debe estar desplegado primero)
        address usdTokenAddress = vm.envAddress("USDTOKEN_ADDRESS");
        
        require(usdTokenAddress != address(0), "USDTOKEN_ADDRESS not set");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Ecommerce
        ecommerce = new Ecommerce(deployer, usdTokenAddress);
        
        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("Owner:", deployer);
        console.log("USDToken address:", usdTokenAddress);

        vm.stopBroadcast();

        return ecommerce;
    }
}

