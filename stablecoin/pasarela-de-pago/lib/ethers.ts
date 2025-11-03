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
  const functionSignature = '0x70a08231'; // keccak256("balanceOf(address)") primeros 4 bytes
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
 */
function formatUnitsManual(value: bigint | string, decimals: number): string {
  const bigIntValue = typeof value === 'string' ? BigInt(value) : value;
  const divisor = BigInt(10 ** decimals);
  const wholePart = bigIntValue / divisor;
  const fractionalPart = bigIntValue % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const fractionalTrimmed = fractionalStr.replace(/0+$/, '') || '0';
  
  return `${wholePart.toString()}.${fractionalTrimmed}`;
}

/**
 * Obtener el balance de tokens ERC20
 */
export async function getTokenBalance(
  contractAddress: string,
  userAddress: string,
  forceRefresh: boolean = false
): Promise<string> {
  const useProxy = typeof window !== 'undefined';
  
  if (useProxy) {
    try {
      const data = encodeBalanceOfCall(userAddress);
      
      const result = await rpcCall('eth_call', [
        {
          to: contractAddress,
          data: data,
        },
        'latest',
      ]);
      
      const balanceBigInt = decodeUint256(result);
      const balanceFormatted = formatUnitsManual(balanceBigInt, 6);
      return balanceFormatted;
    } catch (error) {
      console.error('❌ Error al obtener balance:', error);
      throw error;
    }
  } else {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const abi = ['function balanceOf(address) view returns (uint256)'];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const balance = await contract.balanceOf(userAddress, { blockTag: 'latest' });
    return ethers.formatUnits(balance, 6);
  }
}

/**
 * Obtener allowance de tokens
 */
export async function getTokenAllowance(
  contractAddress: string,
  userAddress: string,
  spenderAddress: string
): Promise<string> {
  const useProxy = typeof window !== 'undefined';
  
  if (useProxy) {
    try {
      // Función: allowance(address,address) - 0xdd62ed3e
      const functionSignature = '0xdd62ed3e';
      const ownerPadded = userAddress.slice(2).padStart(64, '0');
      const spenderPadded = spenderAddress.slice(2).padStart(64, '0');
      const data = functionSignature + ownerPadded + spenderPadded;
      
      const result = await rpcCall('eth_call', [
        {
          to: contractAddress,
          data: data,
        },
        'latest',
      ]);
      
      const allowanceBigInt = decodeUint256(result);
      return formatUnitsManual(allowanceBigInt, 6);
    } catch (error) {
      console.error('❌ Error al obtener allowance:', error);
      throw error;
    }
  } else {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const abi = ['function allowance(address,address) view returns (uint256)'];
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const allowance = await contract.allowance(userAddress, spenderAddress);
    return ethers.formatUnits(allowance, 6);
  }
}

/**
 * Formatear cantidad de tokens para mostrar
 */
export function formatTokenAmount(amount: string): string {
  return parseFloat(amount).toFixed(2);
}

