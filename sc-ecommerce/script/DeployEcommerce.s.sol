// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import "../src/Ecommerce.sol";

/**
 * @title DeployEcommerce
 * @notice Script de deploy para el contrato Ecommerce
 * @notice El oráculo debe estar desplegado primero (usar DeployExchangeRateOracle.s.sol)
 */
contract DeployEcommerce is Script {
    Ecommerce public ecommerce;
    
    function run() external returns (Ecommerce) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Direcciones de los tokens (deben estar desplegados primero)
        address usdTokenAddress = vm.envAddress("USDTOKEN_ADDRESS");
        address eurtTokenAddress = vm.envAddress("EURTOKEN_ADDRESS");
        
        // Dirección del oráculo (debe estar desplegado primero)
        // Si no está configurado, el script fallará para evitar deploy incorrecto
        address oracleAddress = vm.envAddress("EXCHANGE_RATE_ORACLE_ADDRESS");
        
        require(usdTokenAddress != address(0), "USDTOKEN_ADDRESS not set");
        require(eurtTokenAddress != address(0), "EURTOKEN_ADDRESS not set");
        require(oracleAddress != address(0), "EXCHANGE_RATE_ORACLE_ADDRESS not set. Deploy oracle first.");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Ecommerce con el oráculo
        ecommerce = new Ecommerce(
            deployer,
            usdTokenAddress,
            eurtTokenAddress,
            oracleAddress
        );
        
        console.log("Ecommerce deployed at:", address(ecommerce));
        console.log("Owner:", deployer);
        console.log("USDToken address:", usdTokenAddress);
        console.log("EURToken address:", eurtTokenAddress);
        console.log("Oracle address:", oracleAddress);

        vm.stopBroadcast();

        return ecommerce;
    }
}

