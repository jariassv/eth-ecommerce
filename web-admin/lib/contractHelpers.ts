/**
 * Funciones helper para mapear datos de contratos
 * Convierte datos raw del contrato a tipos TypeScript
 */

import { Product, Invoice, Review, Company } from './contracts';

/**
 * Mapea un producto raw del contrato a la interfaz Product
 */
export function mapRawProductToProduct(rawProduct: any): Product {
  const ipfsHash = rawProduct.ipfsImageHash || '';
  return {
    productId: BigInt(rawProduct.productId.toString()),
    companyId: BigInt(rawProduct.companyId.toString()),
    name: rawProduct.name,
    description: rawProduct.description,
    price: BigInt(rawProduct.price.toString()),
    stock: BigInt(rawProduct.stock.toString()),
    ipfsImageHash: ipfsHash,
    ipfsAdditionalImages: rawProduct.ipfsAdditionalImages || [],
    totalSales: BigInt(rawProduct.totalSales.toString()),
    isActive: rawProduct.isActive,
  };
}

/**
 * Mapea una factura raw del contrato a la interfaz Invoice
 */
export function mapRawInvoiceToInvoice(rawInvoice: any): Invoice {
  return {
    invoiceId: BigInt(rawInvoice.invoiceId.toString()),
    companyId: BigInt(rawInvoice.companyId.toString()),
    customerAddress: rawInvoice.customerAddress,
    totalAmount: BigInt(rawInvoice.totalAmount.toString()),
    timestamp: BigInt(rawInvoice.timestamp.toString()),
    isPaid: rawInvoice.isPaid,
    paymentTxHash: rawInvoice.paymentTxHash,
    itemCount: BigInt(rawInvoice.itemCount.toString()),
    paymentToken: rawInvoice.paymentToken || '0x0000000000000000000000000000000000000000',
    expectedTotalUSDT: BigInt(rawInvoice.expectedTotalUSDT?.toString() || '0'),
  };
}

/**
 * Mapea un review raw del contrato a la interfaz Review
 */
export function mapRawReviewToReview(rawReview: any): Review {
  return {
    reviewId: BigInt(rawReview.reviewId.toString()),
    productId: BigInt(rawReview.productId.toString()),
    customerAddress: rawReview.customerAddress,
    rating: BigInt(rawReview.rating.toString()),
    comment: rawReview.comment,
    timestamp: BigInt(rawReview.timestamp.toString()),
    isVerified: rawReview.isVerified,
  };
}

/**
 * Mapea una empresa raw del contrato a la interfaz Company
 */
export function mapRawCompanyToCompany(rawCompany: any): Company {
  return {
    companyId: BigInt(rawCompany.companyId.toString()),
    name: rawCompany.name,
    companyAddress: rawCompany.companyAddress,
    taxId: rawCompany.taxId,
    isActive: rawCompany.isActive,
  };
}

