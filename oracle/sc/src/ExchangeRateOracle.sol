// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ExchangeRateOracle
 * @dev Oráculo simple para tasa de cambio entre EURT y USDT
 * @notice El rate se almacena como: 1 EUR = (rate / 1e6) USD
 *         Ejemplo: rate = 1,100,000 significa 1 EUR = 1.10 USD
 */
contract ExchangeRateOracle is Ownable {
    // Rate de conversión: 1 EUR = (rate / 1e6) USD
    // Ejemplo: 1,100,000 = 1.10 USD por EUR
    uint256 private rate; // En 6 decimales (1e6 = 1.0)
    
    // Timestamp de la última actualización
    uint256 public lastUpdate;
    
    // Direcciones de los tokens
    address public immutable usdtToken;
    address public immutable eurtToken;
    
    // Constantes para validación
    uint256 private constant MIN_RATE = 8e5; // 0.8 (mínimo razonable)
    uint256 private constant MAX_RATE = 15e5; // 1.5 (máximo razonable)
    uint256 private constant RATE_VALIDITY_PERIOD = 24 hours;
    
    // Eventos
    event RateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);
    
    /**
     * @dev Constructor
     * @param initialOwner Dirección del propietario
     * @param usdtAddress Dirección del contrato USDToken
     * @param eurtAddress Dirección del contrato EURToken
     * @param initialRate Rate inicial (ej: 1,100,000 = 1.10 USD/EUR)
     */
    constructor(
        address initialOwner,
        address usdtAddress,
        address eurtAddress,
        uint256 initialRate
    ) Ownable(initialOwner) {
        require(usdtAddress != address(0), "ExchangeRateOracle: invalid USDT address");
        require(eurtAddress != address(0), "ExchangeRateOracle: invalid EURT address");
        require(initialRate > 0, "ExchangeRateOracle: invalid initial rate");
        require(initialRate >= MIN_RATE && initialRate <= MAX_RATE, "ExchangeRateOracle: rate out of range");
        
        usdtToken = usdtAddress;
        eurtToken = eurtAddress;
        rate = initialRate;
        lastUpdate = block.timestamp;
        
        emit RateUpdated(0, initialRate, block.timestamp);
    }
    
    /**
     * @dev Actualizar el rate de conversión (solo owner)
     * @param newRate Nuevo rate en 6 decimales (ej: 1,100,000 = 1.10)
     */
    function updateRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "ExchangeRateOracle: rate must be positive");
        require(newRate >= MIN_RATE && newRate <= MAX_RATE, "ExchangeRateOracle: rate out of range");
        
        uint256 oldRate = rate;
        rate = newRate;
        lastUpdate = block.timestamp;
        
        emit RateUpdated(oldRate, newRate, block.timestamp);
    }
    
    /**
     * @dev Obtener el rate actual
     * @return rate Rate actual en 6 decimales
     */
    function getRate() external view returns (uint256) {
        return rate;
    }
    
    /**
     * @dev Convertir EURT a USDT
     * @param eurtAmount Cantidad de EURT (en 6 decimales)
     * @return usdtAmount Cantidad equivalente en USDT (en 6 decimales)
     */
    function convertEURTtoUSDT(uint256 eurtAmount) external view returns (uint256) {
        // eurtAmount * rate / 1e6
        return (eurtAmount * rate) / 1e6;
    }
    
    /**
     * @dev Convertir USDT a EURT
     * @param usdtAmount Cantidad de USDT (en 6 decimales)
     * @return eurtAmount Cantidad equivalente en EURT (en 6 decimales)
     */
    function convertUSDTtoEURT(uint256 usdtAmount) external view returns (uint256) {
        // usdtAmount * 1e6 / rate
        return (usdtAmount * 1e6) / rate;
    }
    
    /**
     * @dev Obtener el rate como decimal (ej: 1.10)
     * @return rateDecimal Rate en formato decimal
     */
    function getRateAsDecimal() external view returns (uint256) {
        return rate; // Ya está en 6 decimales
    }
    
    /**
     * @dev Verificar si el rate es válido (menos de 24 horas desde última actualización)
     * @return bool True si el rate es válido
     */
    function isRateValid() external view returns (bool) {
        return block.timestamp - lastUpdate < RATE_VALIDITY_PERIOD;
    }
    
    /**
     * @dev Obtener los límites de rate permitidos
     * @return minRate Rate mínimo permitido
     * @return maxRate Rate máximo permitido
     */
    function getRateLimits() external pure returns (uint256 minRate, uint256 maxRate) {
        return (MIN_RATE, MAX_RATE);
    }
    
    /**
     * @dev Obtener el tiempo transcurrido desde la última actualización
     * @return secondsElapsed Segundos transcurridos
     */
    function getTimeSinceLastUpdate() external view returns (uint256) {
        return block.timestamp - lastUpdate;
    }
}

