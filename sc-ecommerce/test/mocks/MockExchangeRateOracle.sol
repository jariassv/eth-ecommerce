// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockExchangeRateOracle
 * @dev Mock del contrato ExchangeRateOracle para tests
 */
contract MockExchangeRateOracle is Ownable {
    uint256 private rate;
    uint256 public lastUpdate;
    address public immutable usdtToken;
    address public immutable eurtToken;
    
    uint256 private constant MIN_RATE = 8e5;
    uint256 private constant MAX_RATE = 15e5;
    uint256 private constant RATE_VALIDITY_PERIOD = 24 hours;
    
    event RateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);
    
    constructor(
        address initialOwner,
        address usdtAddress,
        address eurtAddress,
        uint256 initialRate
    ) Ownable(initialOwner) {
        require(usdtAddress != address(0), "MockExchangeRateOracle: invalid USDT address");
        require(eurtAddress != address(0), "MockExchangeRateOracle: invalid EURT address");
        require(initialRate > 0, "MockExchangeRateOracle: invalid initial rate");
        require(initialRate >= MIN_RATE && initialRate <= MAX_RATE, "MockExchangeRateOracle: rate out of range");
        
        usdtToken = usdtAddress;
        eurtToken = eurtAddress;
        rate = initialRate;
        lastUpdate = block.timestamp;
        
        emit RateUpdated(0, initialRate, block.timestamp);
    }
    
    function updateRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "MockExchangeRateOracle: rate must be positive");
        require(newRate >= MIN_RATE && newRate <= MAX_RATE, "MockExchangeRateOracle: rate out of range");
        
        uint256 oldRate = rate;
        rate = newRate;
        lastUpdate = block.timestamp;
        
        emit RateUpdated(oldRate, newRate, block.timestamp);
    }
    
    function getRate() external view returns (uint256) {
        return rate;
    }
    
    function convertEURTtoUSDT(uint256 eurtAmount) external view returns (uint256) {
        return (eurtAmount * rate) / 1e6;
    }
    
    function convertUSDTtoEURT(uint256 usdtAmount) external view returns (uint256) {
        return (usdtAmount * 1e6) / rate;
    }
    
    function isRateValid() external view returns (bool) {
        return block.timestamp - lastUpdate < RATE_VALIDITY_PERIOD;
    }
}

