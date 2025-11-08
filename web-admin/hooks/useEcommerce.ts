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
import { mapRawProductToProduct, mapRawInvoiceToInvoice, mapRawReviewToReview, mapRawCompanyToCompany } from '@/lib/contractHelpers';
import { CONTRACTS, RPC_URL } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Helper para crear un provider si no hay uno disponible
function getOrCreateProvider(provider: ethers.BrowserProvider | null): ethers.Provider {
  if (provider) {
    return provider;
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

// Helper para detectar si un error es un error de RPC esperado (red no sincronizada, etc)
function isExpectedRPCError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  
  // Verificar si es un error de ethers.js con código de error RPC
  if ('code' in err && typeof err.code === 'string') {
    // Errores de red común cuando la red local está iniciando
    if (err.code === 'UNKNOWN_ERROR' || err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') {
      return true;
    }
  }
  
  // Verificar si el mensaje contiene errores de bloque fuera de rango
  const message = 'message' in err && typeof err.message === 'string' ? err.message : '';
  const errorString = JSON.stringify(err);
  
  if (
    message.includes('BlockOutOfRangeError') ||
    message.includes('block height') ||
    message.includes('block number') ||
    errorString.includes('BlockOutOfRangeError') ||
    errorString.includes('-32602') // Invalid params error code
  ) {
    return true;
  }
  
  return false;
}

const ECOMMERCE_ADDRESS = CONTRACTS.ECOMMERCE;

export function useEcommerce(provider: ethers.BrowserProvider | null, address: string | null) {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractWithSigner, setContractWithSigner] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!ECOMMERCE_ADDRESS || ECOMMERCE_ADDRESS === '') {
      setError('Dirección del contrato Ecommerce no configurada. Verifica NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS en .env.local');
      setIsInitializing(false);
      return;
    }

    // Validar que la dirección sea válida
    if (!ethers.isAddress(ECOMMERCE_ADDRESS)) {
      setError(`Dirección del contrato Ecommerce inválida: ${ECOMMERCE_ADDRESS}`);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    const initContracts = async () => {
      try {
        const contractProvider = getOrCreateProvider(provider);
        
        // Verificar que el contrato existe en la dirección antes de crear la instancia
        const code = await contractProvider.getCode(ECOMMERCE_ADDRESS);
        if (!code || code === '0x') {
          throw new Error(`No hay contrato desplegado en la dirección ${ECOMMERCE_ADDRESS}. Ejecuta restart-all.sh para desplegar los contratos.`);
        }
        
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
        // Si es un error esperado de RPC (red no sincronizada, etc), usar warn en lugar de error
        if (isExpectedRPCError(err)) {
          logger.warn('Red no sincronizada o contrato aún no disponible. Esto es normal durante el inicio de la red local.');
          logger.debug('Detalles del error RPC:', err);
          // No establecer error en el estado para no molestar al usuario con errores esperados
          setError(null);
        } else {
          logger.error('Error initializing contracts:', err);
          const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
          setError(`Error al inicializar contratos: ${errorMessage}`);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initContracts();
  }, [provider, address]);

  // ============ EMPRESAS ============

  const getOwner = useCallback(async (): Promise<string> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    if (!ECOMMERCE_ADDRESS || ECOMMERCE_ADDRESS === '') {
      throw new Error('Dirección del contrato Ecommerce no configurada');
    }
    
    try {
      // Verificar que el contrato tiene código (está desplegado)
      const code = await contract.runner?.provider?.getCode(ECOMMERCE_ADDRESS);
      if (!code || code === '0x') {
        throw new Error('No hay contrato desplegado en la dirección configurada');
      }
      
      const owner = await contract.owner();
      return owner;
    } catch (err: unknown) {
      // Si es un error esperado de RPC, usar warn y no establecer error en estado
      if (isExpectedRPCError(err)) {
        logger.warn('No se pudo obtener el owner del contrato. La red puede estar iniciando.');
        logger.debug('Detalles del error RPC:', err);
        setError(null);
        throw new Error('Contrato no disponible. La red local puede estar iniciando.');
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener owner';
      logger.error('Error en getOwner:', errorMessage, err);
      setError(errorMessage);
      throw err;
    }
  }, [contract]);

  const registerCompany = useCallback(async (companyAddress: string, name: string, taxId: string): Promise<bigint> => {
    if (!contractWithSigner || !contract) throw new Error('Contrato no inicializado o wallet no conectada');
    
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar empresa';
      setError(errorMessage);
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
      return mapRawCompanyToCompany(company);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener empresa';
      setError(errorMessage);
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener ID de empresa';
      setError(errorMessage);
      throw err;
    }
  }, [contract]);

  const getCompanyCount = useCallback(async (): Promise<bigint> => {
    if (!contract) throw new Error('Contrato no inicializado');

    try {
      const count = await contract.getCompanyCount();
      return BigInt(count.toString());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener cantidad de empresas';
      setError(errorMessage);
      throw err;
    }
  }, [contract]);

  const getAllCompanies = useCallback(async (): Promise<Company[]> => {
    if (!contract) throw new Error('Contrato no inicializado');

    try {
      const countBigInt = await getCompanyCount();
      const count = Number(countBigInt);
      if (count === 0) {
        return [];
      }

      const companies: Company[] = [];
      for (let i = 1; i <= count; i++) {
        try {
          const company = await contract.getCompany(BigInt(i));
          companies.push(mapRawCompanyToCompany(company));
        } catch (err) {
          logger.error(`Error al obtener empresa ${i}:`, err);
        }
      }

      return companies;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener empresas';
      setError(errorMessage);
      throw err;
    }
  }, [contract, getCompanyCount]);

  // ============ PRODUCTOS ============

  const addProduct = useCallback(async (
    name: string,
    description: string,
    price: bigint,
    stock: bigint,
    ipfsImageHash: string,
    ipfsAdditionalImages: string[] = []
  ): Promise<bigint> => {
    if (!contractWithSigner || !contract) throw new Error('Contrato no inicializado o wallet no conectada');
    
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar producto';
      setError(errorMessage);
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar producto';
      setError(errorMessage);
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado del producto';
      setError(errorMessage);
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
        const mappedProduct = mapRawProductToProduct(p);
        // Log para debug
        if (mappedProduct.ipfsImageHash) {
          logger.debug('Producto obtenido del contrato:', mappedProduct.name, 'Hash IPFS:', mappedProduct.ipfsImageHash);
        }
        return mappedProduct;
      });
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

  // ============ FACTURAS ============

  const getCompanyInvoices = useCallback(async (companyId: bigint): Promise<Invoice[]> => {
    // getCompanyInvoices requiere msg.sender, necesitamos usar contractWithSigner
    if (!contractWithSigner) {
      console.warn('getCompanyInvoices: contractWithSigner no está disponible');
      // No lanzar error si no hay wallet conectado, solo retornar array vacío
      // Esto evita errores en consola cuando el componente se carga antes de conectar wallet
      return [];
    }
    
    setLoading(true);
    setError(null);
    try {
      logger.debug('getCompanyInvoices: Calling contract with companyId:', companyId.toString());
      const invoices = await contractWithSigner.getCompanyInvoices(companyId);
      logger.debug('getCompanyInvoices: Raw invoices from contract:', invoices);
      const mappedInvoices = invoices.map((inv: any) => mapRawInvoiceToInvoice(inv));
      logger.debug('getCompanyInvoices: Mapped invoices:', mappedInvoices);
      return mappedInvoices;
    } catch (err: unknown) {
      logger.error('getCompanyInvoices: Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener facturas';
      setError(errorMessage);
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
    
    try {
      const items = await contract.getInvoiceItems(invoiceId);
      return items.map((item: any) => ({
        productId: BigInt(item.productId.toString()),
        quantity: BigInt(item.quantity.toString()),
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener items de factura';
      setError(errorMessage);
      throw err;
    }
  }, [contract]);

  // ============ REVIEWS ============

  const getProductReviews = useCallback(async (productId: bigint): Promise<Review[]> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const reviews = await contract.getProductReviews(productId);
      return reviews.map((r: any) => mapRawReviewToReview(r));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reviews';
      setError(errorMessage);
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener rating promedio';
      setError(errorMessage);
      throw err;
    }
  }, [contract]);

  const getProductReviewCount = useCallback(async (productId: bigint): Promise<bigint> => {
    if (!contract) throw new Error('Contrato no inicializado');
    
    try {
      const count = await contract.getProductReviewCount(productId);
      return BigInt(count.toString());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener cantidad de reviews';
      setError(errorMessage);
      throw err;
    }
  }, [contract]);

  return {
    contract,
    contractWithSigner,
    loading,
    error,
    isReady: !!contract && !isInitializing,
    isReadyWithSigner: !!contractWithSigner && !isInitializing,
    isInitializing,
    // Empresas
    getOwner,
    registerCompany,
    getCompany,
    getCompanyIdByAddress,
    getCompanyCount,
    getAllCompanies,
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

