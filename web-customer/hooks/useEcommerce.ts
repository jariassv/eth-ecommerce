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
        console.error('Error initializing contracts:', err);
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
      return products.map((p: any) => ({
        productId: BigInt(p.productId.toString()),
        companyId: BigInt(p.companyId.toString()),
        name: p.name,
        description: p.description,
        price: BigInt(p.price.toString()),
        stock: BigInt(p.stock.toString()),
        ipfsImageHash: p.ipfsImageHash,
        ipfsAdditionalImages: p.ipfsAdditionalImages || [],
        totalSales: BigInt(p.totalSales.toString()),
        isActive: p.isActive,
      }));
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
    } catch (err: any) {
      setError(err.message || 'Error al obtener carrito');
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
      console.log('Agregando al carrito:', { productId: productId.toString(), quantity: quantity.toString() });
      const tx = await contractWithSigner.addToCart(productId, quantity);
      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      return receipt.hash;
    } catch (err: any) {
      console.error('Error en addToCart:', err);
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || 'Error al agregar al carrito');
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
      console.log('Removiendo del carrito:', { productId: productId.toString() });
      const tx = await contractWithSigner.removeFromCart(productId);
      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      return receipt.hash;
    } catch (err: any) {
      console.error('Error en removeFromCart:', err);
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || 'Error al remover del carrito');
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
      console.log('Actualizando item del carrito:', { productId: productId.toString(), quantity: quantity.toString() });
      const tx = await contractWithSigner.updateCartItem(productId, quantity);
      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      return receipt.hash;
    } catch (err: any) {
      console.error('Error en updateCartItem:', err);
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || 'Error al actualizar item del carrito');
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
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || 'Error al limpiar carrito');
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
    } catch (err: any) {
      setError(err.message || 'Error al obtener total del carrito');
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
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || 'Error al crear factura');
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
      console.error('Error al obtener facturas:', err);
      setError(err.message || 'Error al obtener facturas');
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
    } catch (err: any) {
      setError(err.message || 'Error al obtener empresa');
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
    getMyInvoices,
    getInvoice,
    getInvoiceItems,
    // Empresas
    getCompany,
  };
}

