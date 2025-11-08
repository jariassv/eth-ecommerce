import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { RPC_URL } from './config.js';

dotenv.config();

// ABI del contrato ExchangeRateOracle
const ORACLE_ABI = [
  "function getRate() external view returns (uint256)",
  "function updateRate(uint256 newRate) external",
  "function lastUpdate() external view returns (uint256)",
  "function isRateValid() external view returns (bool)",
  "function owner() external view returns (address)"
];

/**
 * Convertir rate decimal a formato del contrato (6 decimales)
 * @param {number} rateDecimal - Rate en formato decimal (ej: 1.10)
 * @returns {bigint} Rate en formato del contrato (ej: 1100000)
 */
function convertRateToContractFormat(rateDecimal) {
  return BigInt(Math.round(rateDecimal * 1e6));
}

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
 * Verificar que el wallet es el owner del contrato
 */
async function verifyOwnership(oracleContract, walletAddress) {
  try {
    const owner = await oracleContract.owner();
    if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error(`Wallet ${walletAddress} is not the owner. Owner is ${owner}`);
    }
    return true;
  } catch (error) {
    throw new Error(`Failed to verify ownership: ${error.message}`);
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
    console.log(`Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
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
 * Validar que el rate esté en un rango razonable
 */
function validateRate(rateDecimal) {
  const MIN_RATE = 0.8;
  const MAX_RATE = 1.5;
  
  if (rateDecimal < MIN_RATE || rateDecimal > MAX_RATE) {
    throw new Error(`Rate ${rateDecimal} is out of valid range (${MIN_RATE} - ${MAX_RATE})`);
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('=== Oracle Rate Manual Updater ===');
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Validar variables de entorno
    const oracleAddress = process.env.EXCHANGE_RATE_ORACLE_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!oracleAddress) {
      throw new Error('EXCHANGE_RATE_ORACLE_ADDRESS environment variable is not set');
    }
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is not set');
    }
    
    // Obtener rate desde argumentos de línea de comandos
    const rateArg = process.argv[2];
    if (!rateArg) {
      throw new Error('Rate is required. Usage: npm run update-rate-manual <rate>\nExample: npm run update-rate-manual 1.10');
    }
    
    const rateDecimal = parseFloat(rateArg);
    if (isNaN(rateDecimal) || rateDecimal <= 0) {
      throw new Error(`Invalid rate: ${rateArg}. Rate must be a positive number.\nExample: 1.10`);
    }
    
    // Validar rango
    validateRate(rateDecimal);
    
    // Convertir a formato del contrato
    const newRate = convertRateToContractFormat(rateDecimal);
    
    // Conectar a la blockchain
    console.log(`\nConnecting to RPC: ${RPC_URL}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const oracleContract = new ethers.Contract(oracleAddress, ORACLE_ABI, provider);
    
    console.log(`Oracle contract: ${oracleAddress}`);
    console.log(`Wallet address: ${wallet.address}`);
    
    // Verificar que el wallet es el owner
    console.log('\n--- Verifying ownership ---');
    await verifyOwnership(oracleContract, wallet.address);
    console.log('✓ Wallet is the owner of the contract');
    
    // Obtener rate actual
    console.log('\n--- Current rate ---');
    const currentRate = await getCurrentRate(oracleContract);
    const currentRateDecimal = Number(currentRate) / 1e6;
    console.log(`Current rate: ${currentRate.toString()} (${currentRateDecimal})`);
    
    // Mostrar nuevo rate
    console.log('\n--- New rate ---');
    console.log(`New rate: ${newRate.toString()} (${rateDecimal})`);
    
    // Confirmar si el rate es diferente
    if (currentRate.toString() === newRate.toString()) {
      console.log('\n⚠ Warning: New rate is the same as current rate. Update will still proceed.');
    } else {
      const difference = Math.abs(rateDecimal - currentRateDecimal);
      const percentDifference = (difference / currentRateDecimal) * 100;
      console.log(`Difference: ${difference.toFixed(6)} (${percentDifference.toFixed(4)}%)`);
    }
    
    // Actualizar rate
    console.log('\n--- Updating rate on contract ---');
    const receipt = await updateRate(oracleContract, newRate, wallet);
    
    // Verificar actualización
    console.log('\n--- Verifying update ---');
    const updatedRate = await getCurrentRate(oracleContract);
    const updatedRateDecimal = Number(updatedRate) / 1e6;
    
    if (updatedRate.toString() === newRate.toString()) {
      console.log(`✓ Rate successfully updated to ${updatedRateDecimal}`);
      console.log(`✓ Transaction hash: ${receipt.hash}`);
      process.exit(0);
    } else {
      throw new Error(`Rate update verification failed. Expected ${rateDecimal}, got ${updatedRateDecimal}`);
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.message.includes('Rate is required')) {
      console.error('\nUsage: npm run update-rate-manual <rate>');
      console.error('Example: npm run update-rate-manual 1.10');
    }
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1])) {
  main();
}

