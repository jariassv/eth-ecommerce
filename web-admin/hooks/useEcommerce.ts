'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  getEcommerceContract,
  getEcommerceContractWithSigner,
  ECOMMERCE_ABI,
  Product,
  Company,
  Invoice,
  CartItem,
  Review,
} from '@/lib/contracts';

// Helper para crear un provider si no hay uno disponible
function getOrCreateProvider(provider: ethers.BrowserProvider | null): ethers.Provider {
  if (provider) {
    return provider;
  }
  const rpcUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545')
    : 'http://localhost:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

const ECOMMERCE_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
  : '';

export function useEcommerce(provider: ethers.BrowserProvider | null, address: string | null) {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractWithSigner, setContractWithSigner] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!ECOMMERCE_ADDRESS) {
      setError('Dirección del contrato Ecommerce no configurada');
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    const initContracts = async () => {
      try {
        const contractProvider = getOrCreateProvider(provider);
        
        const contractInstance = new ethers.Contract(
          ECOMMERCE_ADDRESS,
          ECOMMERCE_ABI,
          contractProvider
        );
        
        setContract(contractInstance);

        if (address && provider) {
          const contractWithSignerInstance = await getEcommerceContractWithSigner(
            provider,
            ECOMMERCE_ADDRESS
          );
          setContractWithSigner(contractWithSignerInstance);
        }
        setError(null);
      } catch (err) {
        console.error('Error initializing contracts:', err);
        setError('Error al inicializar contratos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      } finally {
        setIsInitializing(false);
      }
    };

    initContracts();
  }, [provider, address]);

  // ============ EMPRESAS ============

  const getOwner = useCallback(async (): Promise<string> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const owner = await contract.owner();
      return owner;
    } catch (err: any) {
      setError(err.message || 'Error al obtener owner');
      throw err;
    }
  }, [contract]);

  const registerCompany = useCallback(async (companyAddress: string, name: string, taxId: string): Promise<bigint> => {
    if (!contractWithSigner) throw new Error('Contrato no inicializado o wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.registerCompany(companyAddress, name, taxId);
      const receipt = await tx.wait();
      
      // Buscar el evento CompanyRegistered para obtener el companyId
      const event = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'CompanyRegistered';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event);
        return BigInt(parsedLog!.args[0].toString());
      }
      
      // Fallback: buscar por address
      const companyId = await contract.getCompanyIdByAddress(companyAddress);
      return BigInt(companyId.toString());
    } catch (err: any) {
      setError(err.message || 'Error al registrar empresa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, contract]);

  const getCompany = useCallback(async (companyId: bigint): Promise<Company> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const company = await contract.getCompany(companyId);
      return {
        companyId: BigInt(company.companyId.toString()),
        name: company.name,
        companyAddress: company.companyAddress,
        taxId: company.taxId,
        isActive: company.isActive,
      };
    } catch (err: any) {
      setError(err.message || 'Error al obtener empresa');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getCompanyIdByAddress = useCallback(async (companyAddress: string): Promise<bigint> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const companyId = await contract.getCompanyIdByAddress(companyAddress);
      return BigInt(companyId.toString());
    } catch (err: any) {
      setError(err.message || 'Error al obtener ID de empresa');
      throw err;
    }
  }, [contract]);

  // ============ PRODUCTOS ============

  const addProduct = useCallback(async (
    name: string,
    description: string,
    price: bigint,
    stock: bigint,
    ipfsImageHash: string,
    ipfsAdditionalImages: string[] = []
  ): Promise<bigint> => {
    if (!contractWithSigner) throw new Error('Contrato no inicializado o wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.addProduct(
        name,
        description,
        price,
        stock,
        ipfsImageHash,
        ipfsAdditionalImages
      );
      const receipt = await tx.wait();
      
      // Buscar el evento ProductAdded para obtener el productId
      const event = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog && parsedLog.name === 'ProductAdded';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event);
        return BigInt(parsedLog!.args[0].toString());
      }
      
      // Fallback: buscar el último producto agregado
      throw new Error('No se pudo obtener el ID del producto');
    } catch (err: any) {
      setError(err.message || 'Error al agregar producto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, contract]);

  const updateProduct = useCallback(async (
    productId: bigint,
    price: bigint,
    stock: bigint
  ): Promise<void> => {
    if (!contractWithSigner) throw new Error('Contrato no inicializado o wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.updateProduct(productId, price, stock);
      await tx.wait();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar producto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const setProductActive = useCallback(async (
    productId: bigint,
    isActive: boolean
  ): Promise<void> => {
    if (!contractWithSigner) throw new Error('Contrato no inicializado o wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.setProductActive(productId, isActive);
      await tx.wait();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del producto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const getCompanyProducts = useCallback(async (companyId: bigint): Promise<Product[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const products = await contract.getProductsByCompany(companyId);
      return products.map((p: any) => {
        const ipfsHash = p.ipfsImageHash || '';
        // Log para debug
        if (ipfsHash) {
          console.log('Producto obtenido del contrato:', p.name, 'Hash IPFS:', ipfsHash);
        }
        return {
          productId: BigInt(p.productId.toString()),
          companyId: BigInt(p.companyId.toString()),
          name: p.name,
          description: p.description,
          price: BigInt(p.price.toString()),
          stock: BigInt(p.stock.toString()),
          ipfsImageHash: ipfsHash,
          ipfsAdditionalImages: p.ipfsAdditionalImages || [],
          totalSales: BigInt(p.totalSales.toString()),
          isActive: p.isActive,
        };
      });
    } catch (err: any) {
      setError(err.message || 'Error al obtener productos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getProduct = useCallback(async (productId: bigint): Promise<Product> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const product = await contract.getProduct(productId);
      return {
        productId: BigInt(product.productId.toString()),
        companyId: BigInt(product.companyId.toString()),
        name: product.name,
        description: product.description,
        price: BigInt(product.price.toString()),
        stock: BigInt(product.stock.toString()),
        ipfsImageHash: product.ipfsImageHash,
        ipfsAdditionalImages: product.ipfsAdditionalImages || [],
        totalSales: BigInt(product.totalSales.toString()),
        isActive: product.isActive,
      };
    } catch (err: any) {
      setError(err.message || 'Error al obtener producto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // ============ FACTURAS ============

  const getCompanyInvoices = useCallback(async (companyId: bigint): Promise<Invoice[]> => {
    // getCompanyInvoices requiere msg.sender, necesitamos usar contractWithSigner
    if (!contractWithSigner) {
      // No lanzar error si no hay wallet conectado, solo retornar array vacío
      // Esto evita errores en consola cuando el componente se carga antes de conectar wallet
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const invoices = await contractWithSigner.getCompanyInvoices(companyId);
      return invoices.map((inv: any) => ({
        invoiceId: BigInt(inv.invoiceId.toString()),
        companyId: BigInt(inv.companyId.toString()),
        customerAddress: inv.customerAddress,
        totalAmount: BigInt(inv.totalAmount.toString()),
        timestamp: BigInt(inv.timestamp.toString()),
        isPaid: inv.isPaid,
        paymentTxHash: inv.paymentTxHash,
        itemCount: BigInt(inv.itemCount.toString()),
      }));
    } catch (err: any) {
      setError(err.message || 'Error al obtener facturas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const invoice = await contract.getInvoice(invoiceId);
      return {
        invoiceId: BigInt(invoice.invoiceId.toString()),
        companyId: BigInt(invoice.companyId.toString()),
        customerAddress: invoice.customerAddress,
        totalAmount: BigInt(invoice.totalAmount.toString()),
        timestamp: BigInt(invoice.timestamp.toString()),
        isPaid: invoice.isPaid,
        paymentTxHash: invoice.paymentTxHash,
        itemCount: BigInt(invoice.itemCount.toString()),
      };
    } catch (err: any) {
      setError(err.message || 'Error al obtener factura');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getInvoiceItems = useCallback(async (invoiceId: bigint): Promise<CartItem[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const items = await contract.getInvoiceItems(invoiceId);
      return items.map((item: any) => ({
        productId: BigInt(item.productId.toString()),
        quantity: BigInt(item.quantity.toString()),
      }));
    } catch (err: any) {
      setError(err.message || 'Error al obtener items de factura');
      throw err;
    }
  }, [contract]);

  // ============ REVIEWS ============

  const getProductReviews = useCallback(async (productId: bigint): Promise<Review[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const reviews = await contract.getProductReviews(productId);
      return reviews.map((r: any) => ({
        reviewId: BigInt(r.reviewId.toString()),
        productId: BigInt(r.productId.toString()),
        customerAddress: r.customerAddress,
        rating: BigInt(r.rating.toString()),
        comment: r.comment,
        timestamp: BigInt(r.timestamp.toString()),
        isVerified: r.isVerified,
      }));
    } catch (err: any) {
      setError(err.message || 'Error al obtener reviews');
      throw err;
    }
  }, [contract]);

  const getProductAverageRating = useCallback(async (productId: bigint): Promise<{ averageRating: bigint; reviewCount: bigint }> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const result = await contract.getProductAverageRating(productId);
      return {
        averageRating: BigInt(result.averageRating.toString()),
        reviewCount: BigInt(result.reviewCount.toString()),
      };
    } catch (err: any) {
      setError(err.message || 'Error al obtener rating promedio');
      throw err;
    }
  }, [contract]);

  const getProductReviewCount = useCallback(async (productId: bigint): Promise<bigint> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const count = await contract.getProductReviewCount(productId);
      return BigInt(count.toString());
    } catch (err: any) {
      setError(err.message || 'Error al obtener cantidad de reviews');
      throw err;
    }
  }, [contract]);

  return {
    contract,
    contractWithSigner,
    loading,
    error,
    isReady: !!contract && !isInitializing,
    isInitializing,
    // Empresas
    getOwner,
    registerCompany,
    getCompany,
    getCompanyIdByAddress,
    // Productos
    addProduct,
    updateProduct,
    setProductActive,
    getCompanyProducts,
    getProduct,
  // Facturas
  getCompanyInvoices,
  getInvoice,
  getInvoiceItems,
  // Reviews
  getProductReviews,
  getProductAverageRating,
  getProductReviewCount,
  };
}

