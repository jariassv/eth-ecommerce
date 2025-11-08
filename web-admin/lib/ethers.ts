import { ethers } from 'ethers';
import { RPC_URL } from '@/lib/constants';

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

/**
 * Obtener el proveedor de MetaMask
 */
export async function getProvider(): Promise<ethers.BrowserProvider | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Conectar a MetaMask y obtener la cuenta
 */
export async function connectWallet(): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  
  if (accounts.length === 0) {
    throw new Error('No se encontraron cuentas');
  }

  return accounts[0];
}

/**
 * Formatear unidades de tokens
 */
export function formatTokenAmount(amount: bigint, decimals: number = 6): string {
  return ethers.formatUnits(amount, decimals);
}

/**
 * Parsear unidades de tokens
 */
export function parseTokenAmount(amount: string, decimals: number = 6): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Obtener el RPC URL
 */
export function getRpcUrl(): string {
  return RPC_URL;
}

