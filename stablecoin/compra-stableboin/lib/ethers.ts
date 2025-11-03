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
 * IMPORTANTE: Usa API route como proxy para evitar problemas de CORS
 */
export async function getTokenBalance(
  contractAddress: string,
  userAddress: string,
  forceRefresh: boolean = false
): Promise<string> {
  // Usar API route como proxy para evitar problemas de CORS cuando se llama desde el navegador
  // Esto permite que el servidor de Next.js haga la petición a la RPC
  const useProxy = typeof window !== 'undefined'; // Solo usar proxy en el cliente
  
  if (useProxy) {
    // Usar API route como proxy (evita CORS)
    console.log(`🌐 Usando API route como proxy para RPC`);
    
    try {
      // Crear un provider que use la API route
      const proxyUrl = '/api/rpc';
      const provider = new ethers.JsonRpcProvider(proxyUrl);
      
      // ABI mínimo para balanceOf
      const abi = ['function balanceOf(address) view returns (uint256)'];
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      // Verificar conexión
      await provider.getBlockNumber().catch((err) => {
        console.error('❌ Error conectando a RPC via proxy:', err);
        throw new Error('No se puede conectar a la RPC. ¿Está Anvil corriendo?');
      });
      
      const balance = await contract.balanceOf(userAddress, { blockTag: 'latest' });
      return ethers.formatUnits(balance, 6); // USDToken tiene 6 decimales
    } catch (error) {
      console.error('❌ Error al obtener balance:', error);
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Network')) {
          throw new Error('Error de red. Verifica que Anvil esté corriendo en http://localhost:8545');
        }
      }
      throw error;
    }
  } else {
    // En el servidor, usar conexión directa
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const balance = await contract.balanceOf(userAddress, { blockTag: 'latest' });
    return ethers.formatUnits(balance, 6);
  }
}

/**
 * Formatear cantidad de tokens para mostrar
 */
export function formatTokenAmount(amount: string): string {
  return parseFloat(amount).toFixed(2);
}

