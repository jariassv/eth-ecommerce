import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fetchEURUSDRate, convertRateToContractFormat } from './fetch-rate.js';
import { RPC_URL } from './config.js';

dotenv.config();

// ABI del contrato ExchangeRateOracle
const ORACLE_ABI = [
  "function getRate() external view returns (uint256)",
  "function updateRate(uint256 newRate) external",
  "function lastUpdate() external view returns (uint256)",
  "function isRateValid() external view returns (bool)"
];

/**
 * Obtener el rate actual del contrato
 */
async function getCurrentRate(oracleContract) {
  try {
    const rate = await oracleContract.getRate();
    return rate;
  } catch (error) {
    throw new Error(`Failed to get current rate: ${error.message}`);
  }
}

/**
 * Actualizar el rate en el contrato
 */
async function updateRate(oracleContract, newRate, wallet) {
  try {
    console.log(`Updating rate to: ${newRate.toString()} (${Number(newRate) / 1e6})`);
    
    const tx = await oracleContract.connect(wallet).updateRate(newRate);
    console.log(`Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);
    
    return receipt;
  } catch (error) {
    if (error.reason) {
      throw new Error(`Transaction failed: ${error.reason}`);
    } else if (error.data) {
      throw new Error(`Transaction failed: ${error.data.message || JSON.stringify(error.data)}`);
    } else {
      throw new Error(`Failed to update rate: ${error.message}`);
    }
  }
}

/**
 * Verificar si el rate necesita actualización
 * @param {bigint} currentRate - Rate actual en el contrato
 * @param {bigint} newRate - Nuevo rate obtenido
 * @param {number} thresholdPercent - Umbral de diferencia (default: 0.1%)
 * @returns {boolean} True si necesita actualización
 */
function shouldUpdateRate(currentRate, newRate, thresholdPercent = 0.1) {
  const currentDecimal = Number(currentRate) / 1e6;
  const newDecimal = Number(newRate) / 1e6;
  
  const difference = Math.abs(newDecimal - currentDecimal);
  const percentDifference = (difference / currentDecimal) * 100;
  
  console.log(`Current rate: ${currentDecimal}`);
  console.log(`New rate: ${newDecimal}`);
  console.log(`Difference: ${percentDifference.toFixed(4)}%`);
  
  return percentDifference >= thresholdPercent;
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('=== Oracle Rate Updater ===');
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Validar variables de entorno
    const oracleAddress = process.env.EXCHANGE_RATE_ORACLE_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    const thresholdPercent = parseFloat(process.env.RATE_UPDATE_THRESHOLD || '0.1');
    
    if (!oracleAddress) {
      throw new Error('EXCHANGE_RATE_ORACLE_ADDRESS environment variable is not set');
    }
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is not set');
    }
    
    // Conectar a la blockchain
    console.log(`Connecting to RPC: ${RPC_URL}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const oracleContract = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);
    
    console.log(`Oracle contract: ${oracleAddress}`);
    console.log(`Wallet address: ${wallet.address}`);
    
    // Verificar que el wallet es el owner del contrato
    // (Esto se puede hacer llamando a owner() del contrato si está disponible)
    
    // Obtener rate actual
    console.log('\n--- Fetching current rate from contract ---');
    const currentRate = await getCurrentRate(oracleContract);
    console.log(`Current rate: ${currentRate.toString()} (${Number(currentRate) / 1e6})`);
    
    // Obtener nuevo rate desde API externa
    console.log('\n--- Fetching new rate from API ---');
    const newRateDecimal = await fetchEURUSDRate();
    const newRate = convertRateToContractFormat(newRateDecimal);
    
    // Verificar si necesita actualización
    console.log('\n--- Checking if update is needed ---');
    const needsUpdate = shouldUpdateRate(currentRate, newRate, thresholdPercent);
    
    if (!needsUpdate) {
      console.log(`\n✓ Rate is up to date. Difference (${((Math.abs(Number(newRate) - Number(currentRate)) / Number(currentRate)) * 100).toFixed(4)}%) is below threshold (${thresholdPercent}%)`);
      process.exit(0);
    }
    
    // Actualizar rate
    console.log('\n--- Updating rate on contract ---');
    const receipt = await updateRate(oracleContract, newRate, wallet);
    
    // Verificar actualización
    console.log('\n--- Verifying update ---');
    const updatedRate = await getCurrentRate(oracleContract);
    
    if (updatedRate.toString() === newRate.toString()) {
      console.log(`✓ Rate successfully updated to ${Number(updatedRate) / 1e6}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      process.exit(0);
    } else {
      throw new Error('Rate update verification failed');
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

