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
 */
export async function getTokenBalance(
  contractAddress: string,
  userAddress: string
): Promise<string> {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Proveedor no disponible');
  }

  // ABI mínimo para balanceOf
  const abi = ['function balanceOf(address) view returns (uint256)'];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  const balance = await contract.balanceOf(userAddress);
  return ethers.formatUnits(balance, 6); // USDToken tiene 6 decimales
}

/**
 * Formatear cantidad de tokens para mostrar
 */
export function formatTokenAmount(amount: string): string {
  return parseFloat(amount).toFixed(2);
}

