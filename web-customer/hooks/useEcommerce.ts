'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  getEcommerceContract,
  getEcommerceContractWithSigner,
  Product,
  CartItem,
  Invoice,
} from '@/lib/contracts';

const ECOMMERCE_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
  : '';

export function useEcommerce(provider: ethers.BrowserProvider | null, address: string | null) {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractWithSigner, setContractWithSigner] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || !ECOMMERCE_ADDRESS) return;

    const initContracts = async () => {
      try {
        const contractInstance = await getEcommerceContract(provider, ECOMMERCE_ADDRESS);
        setContract(contractInstance);

        if (address) {
          const contractWithSignerInstance = await getEcommerceContractWithSigner(
            provider,
            ECOMMERCE_ADDRESS
          );
          setContractWithSigner(contractWithSignerInstance);
        }
      } catch (err) {
        console.error('Error initializing contracts:', err);
        setError('Error al inicializar contratos');
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
    if (!contract || !address) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const cart = await contract.getCart();
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
  }, [contract, address]);

  const addToCart = useCallback(async (productId: bigint, quantity: bigint): Promise<void> => {
    if (!contractWithSigner) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const tx = await contractWithSigner.addToCart(productId, quantity);
      await tx.wait();
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || 'Error al agregar al carrito');
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
    if (!contract || !address) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const total = await contract.getCartTotal();
      return BigInt(total.toString());
    } catch (err: any) {
      setError(err.message || 'Error al obtener total del carrito');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, address]);

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
    if (!contract || !address) throw new Error('Wallet no conectada');
    
    setLoading(true);
    setError(null);
    try {
      const invoices = await contract.getMyInvoices();
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
  }, [contract, address]);

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
    // Productos
    getAllProducts,
    getProduct,
    // Carrito
    getCart,
    addToCart,
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

