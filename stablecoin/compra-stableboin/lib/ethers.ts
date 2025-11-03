import { ethers } from 'ethers';

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
 * Obtener el balance de tokens ERC20
 * IMPORTANTE: Usa JsonRpcProvider directo para evitar cache de MetaMask
 */
export async function getTokenBalance(
  contractAddress: string,
  userAddress: string,
  forceRefresh: boolean = false
): Promise<string> {
  // Usar JsonRpcProvider directo en lugar de BrowserProvider para evitar cache
  // El BrowserProvider de MetaMask puede cachear datos, causando que el balance no se actualice
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // ABI mínimo para balanceOf
  const abi = ['function balanceOf(address) view returns (uint256)'];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  // Siempre usar blockTag 'latest' para obtener el balance más reciente
  // Esto evita cualquier problema de cache
  try {
    const balance = await contract.balanceOf(userAddress, { blockTag: 'latest' });
    return ethers.formatUnits(balance, 6); // USDToken tiene 6 decimales
  } catch (error) {
    console.error('Error al obtener balance:', error);
    throw error;
  }
}

/**
 * Formatear cantidad de tokens para mostrar
 */
export function formatTokenAmount(amount: string): string {
  return parseFloat(amount).toFixed(2);
}

