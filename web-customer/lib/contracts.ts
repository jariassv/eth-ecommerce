import { ethers } from 'ethers';

// ABI del contrato Ecommerce (funciones que necesitamos para customer)
export const ECOMMERCE_ABI = [
  // Productos
  'function getAllActiveProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive)[])',
  'function getProduct(uint256 productId) external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive))',
  'function getProductCount() external view returns (uint256)',
  
  // Carrito
  'function addToCart(uint256 productId, uint256 quantity) external',
  'function getCart() external view returns (tuple(uint256 productId, uint256 quantity)[])',
  'function getCartTotal() external view returns (uint256)',
  'function clearCart() external',
  
  // Facturas
  'function createInvoice(uint256 companyId) external returns (uint256 invoiceId, uint256 totalAmount)',
  'function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount))',
  'function getMyInvoices() external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount)[])',
  'function getInvoiceItems(uint256 invoiceId) external view returns (tuple(uint256 productId, uint256 quantity)[])',
  
  // Empresas
  'function getCompany(uint256 companyId) external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))',
  
  // Events
  'event AddedToCart(address indexed customer, uint256 indexed productId, uint256 quantity)',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 totalAmount)',
] as const;

/**
 * Interfaz TypeScript para Product
 */
export interface Product {
  productId: bigint;
  companyId: bigint;
  name: string;
  description: string;
  price: bigint;
  stock: bigint;
  ipfsImageHash: string;
  ipfsAdditionalImages: string[];
  totalSales: bigint;
  isActive: boolean;
}

/**
 * Interfaz TypeScript para CartItem
 */
export interface CartItem {
  productId: bigint;
  quantity: bigint;
}

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
}

/**
 * Interfaz TypeScript para Company
 */
export interface Company {
  companyId: bigint;
  name: string;
  companyAddress: string;
  taxId: string;
  isActive: boolean;
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

