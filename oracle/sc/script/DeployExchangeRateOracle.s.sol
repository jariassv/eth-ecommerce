// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ExchangeRateOracle} from "../src/ExchangeRateOracle.sol";

/**
 * @title DeployExchangeRateOracle
 * @notice Script de deploy para el contrato ExchangeRateOracle
 */
contract DeployExchangeRateOracle is Script {
    ExchangeRateOracle public oracle;
    
    function run() external returns (ExchangeRateOracle) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Direcciones de los tokens (deben estar desplegados primero)
        address usdtAddress = vm.envAddress("USDT_TOKEN_ADDRESS");
        address eurtAddress = vm.envAddress("EURT_TOKEN_ADDRESS");
        
        require(usdtAddress != address(0), "USDT_TOKEN_ADDRESS not set");
        require(eurtAddress != address(0), "EURT_TOKEN_ADDRESS not set");
        
        // Rate inicial (obtener de variable de entorno o usar default)
        uint256 initialRate = vm.envOr("INITIAL_RATE", uint256(1_100_000)); // Default: 1.10
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Oracle
        oracle = new ExchangeRateOracle(
            deployer,
            usdtAddress,
            eurtAddress,
            initialRate
        );
        
        console.log("ExchangeRateOracle deployed at:", address(oracle));
        console.log("Owner:", deployer);
        console.log("USDT Token address:", usdtAddress);
        console.log("EURT Token address:", eurtAddress);
        console.log("Initial rate:", initialRate);
        console.log("Rate as decimal:", initialRate / 1e4); // Mostrar como decimal (1.10)
        
        vm.stopBroadcast();
        
        return oracle;
    }
}

