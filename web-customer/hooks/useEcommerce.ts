'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  getEcommerceContract,
  getEcommerceContractWithSigner,
  ECOMMERCE_ABI,
  Product,
  CartItem,
  Invoice,
  Review,
} from '@/lib/contracts';
import { mapRawProductToProduct, mapRawInvoiceToInvoice, mapRawReviewToReview } from '@/lib/contractHelpers';
import { CONTRACTS, RPC_URL } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Helper para crear un provider si no hay uno disponible
function getOrCreateProvider(provider: ethers.BrowserProvider | null): ethers.Provider {
  if (provider) {
    return provider;
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

const ECOMMERCE_ADDRESS = CONTRACTS.ECOMMERCE;

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
        // Si hay provider, usarlo. Si no, crear un JsonRpcProvider para lectura
        const contractProvider = getOrCreateProvider(provider);
        
        // Crear el contrato directamente usando el ABI completo
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
        logger.error('Error initializing contracts:', err);
        setError('Error al inicializar contratos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      } finally {
        setIsInitializing(false);
      }
    };

    initContracts();
  }, [provider, address]);

  // Productos
  const getAllProducts = useCallback(async (): Promise<Product[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const products = await contract.getAllActiveProducts();
      return products.map((p: any) => mapRawProductToProduct(p));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener productos';
      setError(errorMessage);
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
      return mapRawProductToProduct(product);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener producto';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Carrito
  const getCart = useCallback(async (): Promise<CartItem[]> => {
    // getCart requiere msg.sender, necesitamos usar contractWithSigner
    if (!contractWithSigner || !address) {
      // Si no hay wallet conectado, retornar array vacío
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const cart = await contractWithSigner.getCart();
      return cart.map((item: any) => ({
        productId: BigInt(item.productId.toString()),
        quantity: BigInt(item.quantity.toString()),
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, address]);

  const addToCart = useCallback(async (productId: bigint, quantity: bigint): Promise<string> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      logger.debug('Agregando al carrito:', { productId: productId.toString(), quantity: quantity.toString() });
      const tx = await contractWithSigner.addToCart(productId, quantity);
      logger.debug('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      logger.debug('Transacción confirmada:', receipt);
      return receipt.hash;
    } catch (err: unknown) {
      logger.error('Error en addToCart:', err);
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar al carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const removeFromCart = useCallback(async (productId: bigint): Promise<string> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      logger.debug('Removiendo del carrito:', { productId: productId.toString() });
      const tx = await contractWithSigner.removeFromCart(productId);
      logger.debug('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      logger.debug('Transacción confirmada:', receipt);
      return receipt.hash;
    } catch (err: unknown) {
      logger.error('Error en removeFromCart:', err);
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al remover del carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const updateCartItem = useCallback(async (productId: bigint, quantity: bigint): Promise<string> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      logger.debug('Actualizando item del carrito:', { productId: productId.toString(), quantity: quantity.toString() });
      const tx = await contractWithSigner.updateCartItem(productId, quantity);
      logger.debug('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      logger.debug('Transacción confirmada:', receipt);
      return receipt.hash;
    } catch (err: unknown) {
      logger.error('Error en updateCartItem:', err);
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar item del carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const clearCart = useCallback(async (): Promise<void> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.clearCart();
      await tx.wait();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al limpiar carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const getCartTotal = useCallback(async (): Promise<bigint> => {
    // getCartTotal requiere msg.sender, necesitamos usar contractWithSigner
    if (!contractWithSigner || !address) {
      return BigInt(0);
    }
    
    setLoading(true);
    setError(null);
    try {
      const total = await contractWithSigner.getCartTotal();
      return BigInt(total.toString());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener total del carrito';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, address]);

  // Facturas
  const createInvoice = useCallback(async (companyId: bigint): Promise<{ invoiceId: bigint; totalAmount: bigint }> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.createInvoice(companyId);
      const receipt = await tx.wait();
      
      // Buscar el evento InvoiceCreated en los logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contractWithSigner.interface.parseLog(log);
          return parsed?.name === 'InvoiceCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contractWithSigner.interface.parseLog(event);
        return {
          invoiceId: BigInt(parsed?.args[0].toString() || '0'),
          totalAmount: BigInt(parsed?.args[3].toString() || '0'),
        };
      }

      // Fallback: llamar a getMyInvoices y obtener la última
      const invoices = await contractWithSigner.getMyInvoices();
      if (invoices.length > 0) {
        const lastInvoice = invoices[invoices.length - 1];
        return {
          invoiceId: BigInt(lastInvoice.invoiceId.toString()),
          totalAmount: BigInt(lastInvoice.totalAmount.toString()),
        };
      }

      throw new Error('No se pudo obtener el ID de la factura creada');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al crear factura';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const createInvoiceWithCurrency = useCallback(async (
    companyId: bigint,
    paymentToken: string,
    expectedTotalUSDT: bigint
  ): Promise<{ invoiceId: bigint; totalAmount: bigint }> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.createInvoiceWithCurrency(companyId, paymentToken, expectedTotalUSDT);
      const receipt = await tx.wait();
      
      // Buscar el evento InvoiceCreated en los logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contractWithSigner.interface.parseLog(log);
          return parsed?.name === 'InvoiceCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contractWithSigner.interface.parseLog(event);
        return {
          invoiceId: BigInt(parsed?.args[0].toString() || '0'),
          totalAmount: BigInt(parsed?.args[3].toString() || '0'),
        };
      }

      // Fallback: llamar a getMyInvoices y obtener la última
      const invoices = await contractWithSigner.getMyInvoices();
      if (invoices.length > 0) {
        const lastInvoice = invoices[invoices.length - 1];
        return {
          invoiceId: BigInt(lastInvoice.invoiceId.toString()),
          totalAmount: BigInt(lastInvoice.totalAmount.toString()),
        };
      }

      throw new Error('No se pudo obtener el ID de la factura creada');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al crear factura';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner]);

  const getMyInvoices = useCallback(async (): Promise<Invoice[]> => {
    // getMyInvoices requiere msg.sender, necesitamos usar contractWithSigner
    if (!contractWithSigner || !address) {
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const invoices = await contractWithSigner.getMyInvoices();
      return invoices.map((inv: any) => mapRawInvoiceToInvoice(inv));
    } catch (err: unknown) {
      logger.error('Error al obtener facturas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener facturas';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, address]);

  const getInvoice = useCallback(async (invoiceId: bigint): Promise<Invoice> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const invoice = await contract.getInvoice(invoiceId);
      return mapRawInvoiceToInvoice(invoice);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener factura';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getInvoiceItems = useCallback(async (invoiceId: bigint): Promise<CartItem[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const items = await contract.getInvoiceItems(invoiceId);
      return items.map((item: any) => ({
        productId: BigInt(item.productId.toString()),
        quantity: BigInt(item.quantity.toString()),
      }));
    } catch (err: any) {
      setError(err.message || 'Error al obtener items de factura');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Empresas
  const getCompany = useCallback(async (companyId: bigint) => {
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener empresa';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Reviews
  const addReview = useCallback(async (productId: bigint, rating: bigint, comment: string): Promise<bigint> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      logger.debug('Agregando review:', { productId: productId.toString(), rating: rating.toString(), comment });
      const tx = await contractWithSigner.addReview(productId, rating, comment);
      logger.debug('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      logger.debug('Transacción confirmada:', receipt);
      
      // Buscar el evento ReviewAdded para obtener el reviewId
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'ReviewAdded';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = contract.interface.parseLog(event);
        return BigInt(parsed?.args[0].toString() || '0');
      }
      
      throw new Error('No se pudo obtener el ID del review creado');
    } catch (err: unknown) {
      logger.error('Error en addReview:', err);
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar review';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, contract]);

  const getProductReviews = useCallback(async (productId: bigint): Promise<Review[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const reviews = await contract.getProductReviews(productId);
      return reviews.map((r: any) => mapRawReviewToReview(r));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reviews del producto';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getMyReviews = useCallback(async (): Promise<Review[]> => {
    // getMyReviews requiere msg.sender, necesitamos usar contractWithSigner
    if (!contractWithSigner || !address) {
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      const reviews = await contractWithSigner.getMyReviews();
      return reviews.map((r: any) => mapRawReviewToReview(r));
    } catch (err: unknown) {
      logger.error('Error al obtener mis reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener mis reviews';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contractWithSigner, address]);

  const getProductAverageRating = useCallback(async (productId: bigint): Promise<{ averageRating: bigint; reviewCount: bigint }> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    setLoading(true);
    setError(null);
    try {
      const result = await contract.getProductAverageRating(productId);
      return {
        averageRating: BigInt(result[0].toString()),
        reviewCount: BigInt(result[1].toString()),
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener rating promedio';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  return {
    contract,
    contractWithSigner,
    loading,
    error,
    isReady: !!contract && !isInitializing,
    isInitializing,
    // Productos
    getAllProducts,
    getProduct,
    // Carrito
    getCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal,
    // Facturas
    createInvoice,
    createInvoiceWithCurrency,
    getMyInvoices,
    getInvoice,
    getInvoiceItems,
    // Empresas
    getCompany,
    // Reviews
    addReview,
    getProductReviews,
    getMyReviews,
    getProductAverageRating,
  };
}

