'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ERC20_ABI } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { CONTRACTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

const USD_TOKEN_ADDRESS = CONTRACTS.USD_TOKEN;
const EUR_TOKEN_ADDRESS = CONTRACTS.EUR_TOKEN;
const ECOMMERCE_ADDRESS = CONTRACTS.ECOMMERCE;

export type SupportedCurrency = 'USDT' | 'EURT';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  allowance: bigint;
  allowanceFormatted: string;
  hasSufficientBalance: boolean;
  needsApproval: boolean;
}

// Función helper para obtener la moneda inicial desde localStorage
function getInitialCurrency(): SupportedCurrency {
  if (typeof window === 'undefined') return 'USDT';
  const saved = localStorage.getItem('selectedCurrency') as SupportedCurrency | null;
  if (saved && (saved === 'USDT' || saved === 'EURT')) {
    return saved;
  }
  return 'USDT';
}

export function useTokens(provider: ethers.BrowserProvider | null, address: string | null) {
  const [tokens, setTokens] = useState<Map<SupportedCurrency, TokenInfo>>(new Map());
  // Inicializar desde localStorage de forma síncrona
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(getInitialCurrency());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardar moneda seleccionada en localStorage y disparar evento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCurrency', selectedCurrency);
      // Disparar evento personalizado para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: selectedCurrency }));
    }
  }, [selectedCurrency]);

  // Escuchar cambios en localStorage desde otras pestañas o componentes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedCurrency' && e.newValue) {
        const newCurrency = e.newValue as SupportedCurrency;
        if ((newCurrency === 'USDT' || newCurrency === 'EURT') && newCurrency !== selectedCurrency) {
          setSelectedCurrency(newCurrency);
        }
      }
    };

    const handleCurrencyChange = (e: CustomEvent) => {
      const newCurrency = e.detail as SupportedCurrency;
      if (newCurrency !== selectedCurrency) {
        setSelectedCurrency(newCurrency);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
    };
  }, [selectedCurrency]);

  const loadTokenInfo = useCallback(async (tokenAddress: string, currency: SupportedCurrency): Promise<TokenInfo> => {
    if (!provider || !address || !tokenAddress) {
      throw new Error('Provider, address, or token address not available');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [symbol, name, decimals, balance, allowance] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.name(),
      tokenContract.decimals(),
      tokenContract.balanceOf(address),
      tokenContract.allowance(address, ECOMMERCE_ADDRESS),
    ]);

    const balanceBigInt = BigInt(balance.toString());
    const allowanceBigInt = BigInt(allowance.toString());
    const decimalsNum = Number(decimals);

    return {
      address: tokenAddress,
      symbol,
      name,
      decimals: decimalsNum,
      balance: balanceBigInt,
      balanceFormatted: formatTokenAmount(balanceBigInt, decimalsNum),
      allowance: allowanceBigInt,
      allowanceFormatted: formatTokenAmount(allowanceBigInt, decimalsNum),
      hasSufficientBalance: false, // Se calculará después
      needsApproval: false, // Se calculará después
    };
  }, [provider, address]);

  const loadTokens = useCallback(async (requiredAmountUSDT?: bigint, rate?: number) => {
    if (!provider || !address) {
      setTokens(new Map());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokensMap = new Map<SupportedCurrency, TokenInfo>();

      // Cargar USDT
      if (USD_TOKEN_ADDRESS) {
        try {
          const usdtInfo = await loadTokenInfo(USD_TOKEN_ADDRESS, 'USDT');
          if (requiredAmountUSDT !== undefined) {
            // Para USDT, el requiredAmount es directamente en USDT
            usdtInfo.hasSufficientBalance = usdtInfo.balance >= requiredAmountUSDT;
            usdtInfo.needsApproval = usdtInfo.allowance < requiredAmountUSDT;
          }
          tokensMap.set('USDT', usdtInfo);
        } catch (err) {
          logger.error('Error loading USDT info:', err);
        }
      }

      // Cargar EURT
      if (EUR_TOKEN_ADDRESS) {
        try {
          const eurtInfo = await loadTokenInfo(EUR_TOKEN_ADDRESS, 'EURT');
          if (requiredAmountUSDT !== undefined && rate) {
            // Para EURT, necesitamos convertir el requiredAmount de USDT a EURT
            // Importar función de conversión
            const { convertUSDTtoEURT } = await import('@/lib/exchangeRate');
            const requiredAmountEURT = convertUSDTtoEURT(requiredAmountUSDT, rate);
            eurtInfo.hasSufficientBalance = eurtInfo.balance >= requiredAmountEURT;
            eurtInfo.needsApproval = eurtInfo.allowance < requiredAmountEURT;
          } else if (requiredAmountUSDT !== undefined) {
            // Si no hay rate, no podemos validar EURT
            eurtInfo.hasSufficientBalance = false;
            eurtInfo.needsApproval = false;
          }
          tokensMap.set('EURT', eurtInfo);
        } catch (err) {
          logger.error('Error loading EURT info:', err);
        }
      }

      setTokens(tokensMap);
    } catch (err: unknown) {
      logger.error('Error loading tokens:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar información de tokens';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [provider, address, loadTokenInfo]);

  const approveToken = useCallback(async (currency: SupportedCurrency, amount: bigint, requiredAmountUSDT?: bigint, rate?: number): Promise<string> => {
    if (!provider || !address) {
      throw new Error('Wallet no conectada');
    }

    const tokenInfo = tokens.get(currency);
    if (!tokenInfo) {
      throw new Error(`Token ${currency} no encontrado`);
    }

    const signer = await provider.getSigner();
    const tokenContract = new ethers.Contract(tokenInfo.address, ERC20_ABI, signer);

    setLoading(true);
    setError(null);
    try {
      const tx = await tokenContract.approve(ECOMMERCE_ADDRESS, amount);
      const receipt = await tx.wait();
      
      // Recargar tokens después de aprobar con los mismos parámetros
      if (requiredAmountUSDT !== undefined) {
        await loadTokens(requiredAmountUSDT, rate);
      } else {
        await loadTokens();
      }
      
      return receipt.hash;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      const errorMessage = err instanceof Error ? err.message : `Error al aprobar ${currency}`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [provider, address, tokens, loadTokens]);

  // Cargar tokens cuando cambia provider o address
  useEffect(() => {
    if (provider && address) {
      loadTokens();
    } else {
      setTokens(new Map());
    }
  }, [provider, address, loadTokens]);

  const getSelectedToken = useCallback((): TokenInfo | null => {
    return tokens.get(selectedCurrency) || null;
  }, [tokens, selectedCurrency]);

  return {
    tokens,
    selectedCurrency,
    setSelectedCurrency,
    loading,
    error,
    loadTokens,
    approveToken,
    getSelectedToken,
  };
}

