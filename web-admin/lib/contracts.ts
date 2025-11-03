import { ethers } from 'ethers';

// ABI completo del contrato Ecommerce (incluye funciones de admin)
export const ECOMMERCE_ABI = [
  // Empresas
  'function registerCompany(string memory name, string memory taxId) external returns (uint256)',
  'function getCompany(uint256 companyId) external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))',
  'function getCompanyIdByAddress(address companyAddress) external view returns (uint256)',
  'function getCompanyCount() external view returns (uint256)',
  'function setCompanyActive(uint256 companyId, bool isActive) external',
  
  // Productos
  'function addProduct(string memory name, string memory description, uint256 price, uint256 stock, string memory ipfsImageHash, string[] memory ipfsAdditionalImages) external returns (uint256)',
  'function getProduct(uint256 productId) external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive))',
  'function updateProduct(uint256 productId, uint256 price, uint256 stock) external',
  'function setProductActive(uint256 productId, bool isActive) external',
  'function getCompanyProducts(uint256 companyId) external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive)[])',
  'function getAllActiveProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive)[])',
  'function getProductCount() external view returns (uint256)',
  
  // Facturas
  'function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount))',
  'function getCompanyInvoices(uint256 companyId) external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount)[])',
  'function getInvoiceItems(uint256 invoiceId) external view returns (tuple(uint256 productId, uint256 quantity)[])',
  
  // Events
  'event CompanyRegistered(uint256 indexed companyId, address indexed companyAddress, string name)',
  'event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price)',
  'event ProductUpdated(uint256 indexed productId, uint256 price, uint256 stock)',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 totalAmount)',
  'event PaymentProcessed(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 amount, bytes32 paymentTxHash)',
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

