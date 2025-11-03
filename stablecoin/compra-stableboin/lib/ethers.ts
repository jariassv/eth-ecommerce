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
  
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_RPC_URL no está configurada');
  }

  console.log(`🌐 Conectando a RPC: ${rpcUrl}`);
  
  // Configurar opciones del provider para evitar problemas de CORS y network
  const provider = new ethers.JsonRpcProvider(
    rpcUrl,
    undefined,
    {
      staticNetwork: false, // Permitir que detecte la red automáticamente
      batchMaxCount: 1, // No usar batching para evitar problemas
    }
  );

  // ABI mínimo para balanceOf
  const abi = ['function balanceOf(address) view returns (uint256)'];
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  // Siempre usar blockTag 'latest' para obtener el balance más reciente
  // Esto evita cualquier problema de cache
  try {
    // Verificar que el provider esté disponible antes de hacer la llamada
    await provider.getBlockNumber().catch((err) => {
      console.error('❌ Error conectando a RPC:', err);
      throw new Error(`No se puede conectar a la RPC en ${rpcUrl}. ¿Está Anvil corriendo?`);
    });

    const balance = await contract.balanceOf(userAddress, { blockTag: 'latest' });
    return ethers.formatUnits(balance, 6); // USDToken tiene 6 decimales
  } catch (error) {
    console.error('❌ Error al obtener balance:', error);
    if (error instanceof Error) {
      // Si es un error de red, proporcionar un mensaje más útil
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        throw new Error(`Error de red al conectar a ${rpcUrl}. Verifica que Anvil esté corriendo en el puerto 8545.`);
      }
    }
    throw error;
  }
}

/**
 * Formatear cantidad de tokens para mostrar
 */
export function formatTokenAmount(amount: string): string {
  return parseFloat(amount).toFixed(2);
}

