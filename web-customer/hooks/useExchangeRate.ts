'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExchangeRate, getRateInfo, isRateValid, isRateFresh } from '@/lib/exchangeRate';

export type SupportedCurrency = 'USDT' | 'EURT';

interface RateInfo {
  rate: number;
  isValid: boolean;
  isFresh: boolean;
  lastUpdate: number;
  timeSinceUpdate: number;
}

export function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [rateInfo, setRateInfo] = useState<RateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getRateInfo();
      const valid = isRateValid(info.rate);
      const fresh = isRateFresh(info.timeSinceUpdate);
      
      setRate(info.rate);
      setRateInfo({
        rate: info.rate,
        isValid: valid,
        isFresh: fresh,
        lastUpdate: info.lastUpdate,
        timeSinceUpdate: info.timeSinceUpdate,
      });
    } catch (err: any) {
      console.error('Error loading exchange rate:', err);
      setError(err.message || 'Error al cargar el rate de conversión');
      setRate(null);
      setRateInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar rate al montar
  useEffect(() => {
    loadRate();
  }, [loadRate]);

  // Actualizar rate cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadRate();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [loadRate]);

  return {
    rate,
    rateInfo,
    loading,
    error,
    refreshRate: loadRate,
  };
}

