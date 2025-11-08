import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { RPC_URL } from '../config.js';

dotenv.config();

// ABI del contrato ExchangeRateOracle (solo las funciones que necesitamos)
const ORACLE_ABI = [
  "function getRate() external view returns (uint256)",
  "function isRateValid() external view returns (bool)",
  "function lastUpdate() external view returns (uint256)",
  "function getTimeSinceLastUpdate() external view returns (uint256)",
  "function convertEURTtoUSDT(uint256 eurtAmount) external view returns (uint256)",
  "function convertUSDTtoEURT(uint256 usdtAmount) external view returns (uint256)",
  "function usdtToken() external view returns (address)",
  "function eurtToken() external view returns (address)"
];

let provider = null;
let oracleContract = null;

/**
 * Inicializar el provider y el contrato del oráculo
 */
function initializeOracle() {
  if (oracleContract) {
    return oracleContract;
  }

  const oracleAddress = process.env.EXCHANGE_RATE_ORACLE_ADDRESS;

  if (!oracleAddress) {
    throw new Error('EXCHANGE_RATE_ORACLE_ADDRESS environment variable is not set');
  }

  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    oracleContract = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);
    return oracleContract;
  } catch (error) {
    throw new Error(`Failed to initialize oracle contract: ${error.message}`);
  }
}

/**
 * Obtener el rate actual del oráculo
 * @returns {Promise<bigint>} Rate en 6 decimales (ej: 1,100,000 = 1.10)
 */
export async function getExchangeRate() {
  try {
    const contract = initializeOracle();
    const rate = await contract.getRate();
    return rate;
  } catch (error) {
    throw new Error(`Failed to get exchange rate: ${error.message}`);
  }
}

/**
 * Obtener información completa del rate
 * @returns {Promise<Object>} Información del rate
 */
export async function getRateInfo() {
  try {
    const contract = initializeOracle();
    
    const [rate, isValid, lastUpdate, timeSinceUpdate] = await Promise.all([
      contract.getRate(),
      contract.isRateValid(),
      contract.lastUpdate(),
      contract.getTimeSinceLastUpdate()
    ]);

    return {
      rate,
      isValid,
      lastUpdate,
      timeSinceUpdate
    };
  } catch (error) {
    throw new Error(`Failed to get rate info: ${error.message}`);
  }
}

/**
 * Convertir un monto entre USDT y EURT
 * @param {string} from - Moneda origen ('USDT' o 'EURT')
 * @param {string} to - Moneda destino ('USDT' o 'EURT')
 * @param {bigint} amount - Monto a convertir (en 6 decimales)
 * @returns {Promise<bigint>} Monto convertido (en 6 decimales)
 */
export async function convertAmount(from, to, amount) {
  try {
    const contract = initializeOracle();

    if (from === 'USDT' && to === 'EURT') {
      return await contract.convertUSDTtoEURT(amount);
    } else if (from === 'EURT' && to === 'USDT') {
      return await contract.convertEURTtoUSDT(amount);
    } else {
      throw new Error('Invalid conversion pair');
    }
  } catch (error) {
    throw new Error(`Failed to convert amount: ${error.message}`);
  }
}

/**
 * Verificar que el contrato del oráculo está disponible
 * @returns {Promise<boolean>}
 */
export async function isOracleAvailable() {
  try {
    const contract = initializeOracle();
    await contract.getRate();
    return true;
  } catch (error) {
    return false;
  }
}

