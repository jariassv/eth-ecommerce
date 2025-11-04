'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ERC20_ABI } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';

const USD_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
  : '';

const EUR_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
  : '';

const ECOMMERCE_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
  : '';

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

export function useTokens(provider: ethers.BrowserProvider | null, address: string | null) {
  const [tokens, setTokens] = useState<Map<SupportedCurrency, TokenInfo>>(new Map());
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>('USDT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar moneda seleccionada desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedCurrency') as SupportedCurrency | null;
      if (saved && (saved === 'USDT' || saved === 'EURT')) {
        setSelectedCurrency(saved);
      }
    }
  }, []);

  // Guardar moneda seleccionada en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCurrency', selectedCurrency);
    }
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

  const loadTokens = useCallback(async (requiredAmount?: bigint) => {
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
          if (requiredAmount !== undefined) {
            usdtInfo.hasSufficientBalance = usdtInfo.balance >= requiredAmount;
            usdtInfo.needsApproval = usdtInfo.allowance < requiredAmount;
          }
          tokensMap.set('USDT', usdtInfo);
        } catch (err) {
          console.error('Error loading USDT info:', err);
        }
      }

      // Cargar EURT
      if (EUR_TOKEN_ADDRESS) {
        try {
          const eurtInfo = await loadTokenInfo(EUR_TOKEN_ADDRESS, 'EURT');
          if (requiredAmount !== undefined) {
            eurtInfo.hasSufficientBalance = eurtInfo.balance >= requiredAmount;
            eurtInfo.needsApproval = eurtInfo.allowance < requiredAmount;
          }
          tokensMap.set('EURT', eurtInfo);
        } catch (err) {
          console.error('Error loading EURT info:', err);
        }
      }

      setTokens(tokensMap);
    } catch (err: any) {
      console.error('Error loading tokens:', err);
      setError(err.message || 'Error al cargar información de tokens');
    } finally {
      setLoading(false);
    }
  }, [provider, address, loadTokenInfo]);

  const approveToken = useCallback(async (currency: SupportedCurrency, amount: bigint): Promise<string> => {
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
      
      // Recargar tokens después de aprobar
      await loadTokens();
      
      return receipt.hash;
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('Transacción rechazada por el usuario');
      }
      setError(err.message || `Error al aprobar ${currency}`);
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

