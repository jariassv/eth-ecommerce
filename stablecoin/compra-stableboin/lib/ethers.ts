import { ethers } from 'ethers';
import { RPC_URL } from '@/lib/config';

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
 * Realizar llamada RPC a través del proxy
 */
async function rpcCall(method: string, params: any[]): Promise<any> {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }
  return data.result;
}

/**
 * Codificar función balanceOf(address) para llamada RPC
 */
function encodeBalanceOfCall(userAddress: string): string {
  // Función: balanceOf(address) - signature hash
  const functionSignature = '0x70a08231'; // keccak256("balanceOf(address)") primeros 4 bytes
  // Eliminar "0x" y rellenar dirección a 32 bytes (64 caracteres hex)
  const addressPadded = userAddress.slice(2).padStart(64, '0');
  return functionSignature + addressPadded;
}

/**
 * Decodificar resultado uint256 de respuesta RPC
 */
function decodeUint256(hexValue: string): bigint {
  return BigInt(hexValue);
}

/**
 * Convertir unidades de wei a unidades decimales manualmente
 * (evita usar ethers.formatUnits que podría tener dependencias internas)
 */
function formatUnitsManual(value: bigint | string, decimals: number): string {
  const bigIntValue = typeof value === 'string' ? BigInt(value) : value;
  const divisor = BigInt(10 ** decimals);
  const wholePart = bigIntValue / divisor;
  const fractionalPart = bigIntValue % divisor;
  
  // Convertir la parte fraccional a string con padding
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  // Eliminar trailing zeros
  const fractionalTrimmed = fractionalStr.replace(/0+$/, '') || '0';
  
  return `${wholePart.toString()}.${fractionalTrimmed}`;
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
  const useProxy = typeof window !== 'undefined'; // Solo usar proxy en el cliente
  
  if (useProxy) {
    // Usar API route como proxy (evita CORS)
    console.log(`🌐 Usando API route como proxy para RPC`);
    
    try {
      // Codificar la llamada a balanceOf(address)
      const data = encodeBalanceOfCall(userAddress);
      
      // Hacer llamada RPC eth_call
      const result = await rpcCall('eth_call', [
        {
          to: contractAddress,
          data: data,
        },
        'latest', // blockTag
      ]);
      
      // Decodificar el resultado (uint256)
      const balanceBigInt = decodeUint256(result);
      
      // Convertir a string con 6 decimales manualmente (evita usar ethers.formatUnits)
      const balanceFormatted = formatUnitsManual(balanceBigInt, 6);
      console.log(`   Balance raw: ${balanceBigInt.toString()}, formatted: ${balanceFormatted}`);
      return balanceFormatted;
    } catch (error) {
      console.error('❌ Error al obtener balance:', error);
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('RPC')) {
          throw new Error(`Error de red. Verifica que Anvil esté corriendo en ${RPC_URL}`);
        }
      }
      throw error;
    }
  } else {
    // En el servidor, usar conexión directa
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
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

