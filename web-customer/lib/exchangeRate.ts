import { ethers } from 'ethers';
import { ORACLE_API_URL } from './constants';
import { logger } from './logger';

/**
 * Obtener el rate EUR/USD desde la API del oráculo
 */
export async function getExchangeRate(): Promise<number> {
  try {
    const response = await fetch(`${ORACLE_API_URL}/api/rate`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // El rate viene en formato 6 decimales (ej: 1100000 = 1.10)
    return Number(data.rate) / 1e6;
  } catch (error) {
    logger.error('Error fetching exchange rate from API:', error);
    throw error;
  }
}

/**
 * Obtener información completa del rate desde la API
 */
export async function getRateInfo(): Promise<{
  rate: number;
  isValid: boolean;
  lastUpdate: number;
  timeSinceUpdate: number;
}> {
  try {
    const response = await fetch(`${ORACLE_API_URL}/api/rate/info`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return {
      rate: Number(data.rate) / 1e6,
      isValid: data.isValid,
      lastUpdate: Number(data.lastUpdate),
      timeSinceUpdate: Number(data.timeSinceUpdate),
    };
  } catch (error) {
    logger.error('Error fetching rate info from API:', error);
    throw error;
  }
}

/**
 * Convertir EURT a USDT usando el rate
 * @param eurtAmount - Cantidad en EURT (6 decimales)
 * @param rate - Rate EUR/USD (ej: 1.10)
 * @returns Cantidad en USDT (6 decimales)
 */
export function convertEURTtoUSDT(eurtAmount: bigint, rate: number): bigint {
  const rateBigInt = BigInt(Math.round(rate * 1e6));
  return (eurtAmount * rateBigInt) / BigInt(1e6);
}

/**
 * Convertir USDT a EURT usando el rate
 * @param usdtAmount - Cantidad en USDT (6 decimales)
 * @param rate - Rate EUR/USD (ej: 1.10)
 * @returns Cantidad en EURT (6 decimales)
 */
export function convertUSDTtoEURT(usdtAmount: bigint, rate: number): bigint {
  const rateBigInt = BigInt(Math.round(rate * 1e6));
  return (usdtAmount * BigInt(1e6)) / rateBigInt;
}

/**
 * Validar que el rate esté en un rango razonable
 */
export function isRateValid(rate: number): boolean {
  return rate >= 0.8 && rate <= 1.5;
}

/**
 * Validar que el rate no esté desactualizado (menos de 24 horas)
 */
export function isRateFresh(timeSinceUpdate: number): boolean {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  return timeSinceUpdate < TWENTY_FOUR_HOURS;
}

