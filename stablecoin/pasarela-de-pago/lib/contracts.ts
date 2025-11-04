import { ethers } from 'ethers';

// ABI del contrato Ecommerce (funciones necesarias para la pasarela)
export const ECOMMERCE_ABI = [
  'function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount, address paymentToken, uint256 expectedTotalUSDT))',
  'function processPayment(uint256 invoiceId) external returns (bool)',
] as const;

// ABI básico para ERC20
export const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
] as const;

/**
 * Interfaz TypeScript para Invoice
 */
export interface Invoice {
  invoiceId: bigint;
  companyId: bigint;
  customerAddress: string;
  totalAmount: bigint;
  timestamp: bigint;
  isPaid: boolean;
  paymentTxHash: string;
  itemCount: bigint;
  paymentToken: string; // Token de pago (USDT o EURT). Si es address(0), se usa USDT por defecto
  expectedTotalUSDT: bigint; // Total esperado en USDT para validación dual
}

/**
 * Obtener instancia del contrato Ecommerce
 */
export async function getEcommerceContract(
  provider: ethers.BrowserProvider,
  address: string
): Promise<ethers.Contract> {
  return new ethers.Contract(address, ECOMMERCE_ABI, provider);
}

/**
 * Obtener instancia del contrato Ecommerce con signer (para transacciones)
 */
export async function getEcommerceContractWithSigner(
  provider: ethers.BrowserProvider,
  address: string
): Promise<ethers.Contract> {
  const signer = await provider.getSigner();
  return new ethers.Contract(address, ECOMMERCE_ABI, signer);
}

/**
 * Obtener instancia del contrato ERC20
 */
export function getERC20Contract(
  provider: ethers.BrowserProvider,
  address: string
): ethers.Contract {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

/**
 * Obtener instancia del contrato ERC20 con signer
 */
export async function getERC20ContractWithSigner(
  provider: ethers.BrowserProvider,
  address: string
): Promise<ethers.Contract> {
  const signer = await provider.getSigner();
  return new ethers.Contract(address, ERC20_ABI, signer);
}

