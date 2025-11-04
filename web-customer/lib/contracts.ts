import { ethers } from 'ethers';

// ABI del contrato Ecommerce (funciones que necesitamos para customer)
export const ECOMMERCE_ABI = [
  // Productos
  'function getAllActiveProducts() external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive)[])',
  'function getProduct(uint256 productId) external view returns (tuple(uint256 productId, uint256 companyId, string name, string description, uint256 price, uint256 stock, string ipfsImageHash, string[] ipfsAdditionalImages, uint256 totalSales, bool isActive))',
  'function getProductCount() external view returns (uint256)',
  
  // Carrito
  'function addToCart(uint256 productId, uint256 quantity) external',
  'function removeFromCart(uint256 productId) external',
  'function updateCartItem(uint256 productId, uint256 quantity) external',
  'function getCart() external view returns (tuple(uint256 productId, uint256 quantity)[])',
  'function getCartTotal() external view returns (uint256)',
  'function clearCart() external',
  
  // Facturas
  'function createInvoice(uint256 companyId) external returns (uint256 invoiceId, uint256 totalAmount)',
  'function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount, address paymentToken, uint256 expectedTotalUSDT))',
  'function getMyInvoices() external view returns (tuple(uint256 invoiceId, uint256 companyId, address customerAddress, uint256 totalAmount, uint256 timestamp, bool isPaid, bytes32 paymentTxHash, uint256 itemCount, address paymentToken, uint256 expectedTotalUSDT)[])',
  'function getInvoiceItems(uint256 invoiceId) external view returns (tuple(uint256 productId, uint256 quantity)[])',
  
  // Empresas
  'function getCompany(uint256 companyId) external view returns (tuple(uint256 companyId, string name, address companyAddress, string taxId, bool isActive))',
  
  // Reviews
  'function addReview(uint256 productId, uint256 rating, string memory comment) external returns (uint256)',
  'function getReview(uint256 reviewId) external view returns (tuple(uint256 reviewId, uint256 productId, address customerAddress, uint256 rating, string comment, uint256 timestamp, bool isVerified))',
  'function getProductReviews(uint256 productId) external view returns (tuple(uint256 reviewId, uint256 productId, address customerAddress, uint256 rating, string comment, uint256 timestamp, bool isVerified)[])',
  'function getMyReviews() external view returns (tuple(uint256 reviewId, uint256 productId, address customerAddress, uint256 rating, string comment, uint256 timestamp, bool isVerified)[])',
  'function getProductAverageRating(uint256 productId) external view returns (uint256 averageRating, uint256 reviewCount)',
  'function getProductReviewCount(uint256 productId) external view returns (uint256)',
  
  // Events
  'event AddedToCart(address indexed customer, uint256 indexed productId, uint256 quantity)',
  'event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 totalAmount)',
  'event ReviewAdded(uint256 indexed reviewId, uint256 indexed productId, address indexed customer, uint256 rating)',
  
  // Multi-currency
  'function createInvoiceWithCurrency(uint256 companyId, address paymentToken, uint256 expectedTotalUSDT) external returns (uint256 invoiceId, uint256 totalAmount)',
  'function getEURTTokenAddress() external view returns (address)',
] as const;

// ABI del contrato ExchangeRateOracle
export const EXCHANGE_RATE_ORACLE_ABI = [
  'function getRate() external view returns (uint256)',
  'function isRateValid() external view returns (bool)',
  'function lastUpdate() external view returns (uint256)',
  'function getTimeSinceLastUpdate() external view returns (uint256)',
  'function convertEURTtoUSDT(uint256 eurtAmount) external view returns (uint256)',
  'function convertUSDTtoEURT(uint256 usdtAmount) external view returns (uint256)',
  'function usdtToken() external view returns (address)',
  'function eurtToken() external view returns (address)',
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
  paymentToken: string; // Token de pago (USDT o EURT). address(0) = USDT por defecto
  expectedTotalUSDT: bigint; // Total esperado en USDT para validación dual
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
 * Interfaz TypeScript para Review
 */
export interface Review {
  reviewId: bigint;
  productId: bigint;
  customerAddress: string;
  rating: bigint;
  comment: string;
  timestamp: bigint;
  isVerified: boolean;
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

