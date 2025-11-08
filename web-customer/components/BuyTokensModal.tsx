'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { SupportedCurrency } from '@/hooks/useTokens';
import { BUY_TOKENS_URL, CONTRACTS, RPC_URL } from '@/lib/constants';
import { useTokens } from '@/hooks/useTokens';
import { useWallet } from '@/hooks/useWallet';
import { dispatchCartUpdated, dispatchTokenBalanceUpdated } from '@/lib/cartEvents';
import { logger } from '@/lib/logger';
import { ERC20_ABI } from '@/lib/contracts';

interface BuyTokensModalProps {
  currency: SupportedCurrency;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

export default function BuyTokensModal({ 
  currency, 
  isOpen, 
  onClose,
  onPurchaseComplete 
}: BuyTokensModalProps) {
  const { provider, address } = useWallet();
  const { loadTokens } = useTokens(provider, address);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [balanceDetected, setBalanceDetected] = useState(false);
  const readProviderRef = useRef<ethers.JsonRpcProvider | null>(null);
  const isClosingRef = useRef(false);

  const getReadProvider = useCallback((): ethers.JsonRpcProvider => {
    if (!readProviderRef.current) {
      readProviderRef.current = new ethers.JsonRpcProvider(RPC_URL);
    }
    return readProviderRef.current;
  }, []);

  const getTokenAddress = useCallback((): string | null => {
    if (currency === 'USDT') return CONTRACTS.USD_TOKEN || null;
    if (currency === 'EURT') return CONTRACTS.EUR_TOKEN || null;
    return null;
  }, [currency]);

  const fetchTokenBalance = useCallback(async (): Promise<bigint> => {
    if (!address) return 0n;
    const tokenAddress = getTokenAddress();
    if (!tokenAddress) {
      logger.warn(`Token address for ${currency} not configured`);
      return 0n;
    }

    try {
      const readProvider = getReadProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, readProvider);
      const balance = await tokenContract.balanceOf(address);
      return BigInt(balance.toString());
    } catch (err) {
      logger.error('Error fetching token balance from RPC provider:', err);
      return 0n;
    }
  }, [address, currency, getReadProvider, getTokenAddress]);

  const finalizeAndClose = useCallback(
    async (balanceUpdated: boolean) => {
      try {
        await loadTokens();
      } catch (err) {
        logger.debug('Error refreshing tokens after purchase completion:', err);
      }

      dispatchTokenBalanceUpdated();
      dispatchCartUpdated();

      if (onPurchaseComplete) {
        try {
          await onPurchaseComplete();
        } catch (err) {
          logger.debug('Error running onPurchaseComplete callback:', err);
        }
      }

      const delay = balanceUpdated ? 500 : 300;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (!isClosingRef.current) {
        isClosingRef.current = true;
        setPaymentComplete(false);
        setCheckingPayment(false);
        setBalanceDetected(false);
        onClose();
        setTimeout(() => {
          isClosingRef.current = false;
        }, 0);
      }
    },
    [loadTokens, onPurchaseComplete, onClose]
  );

  const handlePurchaseComplete = useCallback(async () => {
    try {
      setCheckingPayment(true);
      setPaymentComplete(true);
      
      let initialBalance = 0n;
      if (address) {
        initialBalance = await fetchTokenBalance();
        logger.debug('Balance inicial detectado:', initialBalance.toString());
      }

      const maxAttempts = 8;
      const pollInterval = 1000;
      let attempts = 0;
      let balanceUpdated = false;

      while (attempts < maxAttempts && !balanceUpdated) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        if (!address) {
          break;
        }

        try {
          const currentBalance = await fetchTokenBalance();
          logger.debug(`Intento ${attempts + 1}: balance actual ${currentBalance.toString()}`);

          if (currentBalance > initialBalance) {
            balanceUpdated = true;
            setBalanceDetected(true);
            logger.debug(
              '✅ Cambio de balance detectado:',
              (currentBalance - initialBalance).toString()
            );
          }
        } catch (err) {
          logger.debug(`Error verificando balance en intento ${attempts + 1}:`, err);
        }

        attempts++;
      }

      await finalizeAndClose(balanceUpdated);
    } catch (err) {
      logger.error('Error al actualizar tokens después de compra:', err);
      await finalizeAndClose(false);
    }
  }, [address, fetchTokenBalance, finalizeAndClose]);

  // Detectar cuando se completa el pago usando postMessage desde el iframe
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Verificar origen por seguridad (ajustar según tu dominio)
      // Aceptar mensajes del mismo origen o de los puertos locales configurados
      const allowedOrigins = [
        window.location.origin,
        'http://localhost:6001',
        'http://127.0.0.1:6001',
        BUY_TOKENS_URL
      ];

      // Permitir mensajes de localhost (desarrollo) o del mismo origen
      const isAllowedOrigin = allowedOrigins.some(origin => {
        try {
          return event.origin === origin || 
                 event.origin.includes('localhost') || 
                 event.origin.includes('127.0.0.1');
        } catch {
          return false;
        }
      });

      if (!isAllowedOrigin) {
        logger.debug('Mensaje rechazado de origen:', event.origin);
        return;
      }

      logger.debug('Mensaje recibido del iframe:', event.data);

      // Detectar diferentes tipos de mensajes de éxito
      if (
        event.data?.type === 'payment-complete' || 
        event.data?.payment === 'success' ||
        event.data?.type === 'TOKEN_PURCHASE_SUCCESS' ||
        event.data?.success === true
      ) {
        logger.debug('Pago completado detectado, actualizando...');
        setPaymentComplete(true);
        setCheckingPayment(true);
        handlePurchaseComplete();
      }
    };

    // También escuchar cambios en la URL del iframe (para detectar ?payment=success)
    const iframe = document.querySelector('iframe[title="Comprar Stablecoins"]') as HTMLIFrameElement;
    let checkUrlInterval: NodeJS.Timeout | null = null;

    if (iframe) {
      checkUrlInterval = setInterval(() => {
        try {
          // Intentar acceder a la URL del iframe (solo funciona si es mismo origen)
          // Si no funciona, el postMessage debería funcionar
          if (iframe.contentWindow) {
            const iframeUrl = iframe.contentWindow.location.href;
            if (iframeUrl.includes('payment=success')) {
              logger.debug('URL del iframe indica pago exitoso');
              setPaymentComplete(true);
              setCheckingPayment(true);
              handlePurchaseComplete();
              if (checkUrlInterval) {
                clearInterval(checkUrlInterval);
              }
            }
          }
        } catch (err) {
          // Cross-origin, no podemos acceder a la URL directamente
          // Esto es normal y esperado
        }
      }, 1000);
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (checkUrlInterval) {
        clearInterval(checkUrlInterval);
      }
    };
  }, [isOpen, handlePurchaseComplete]);

  const handleClose = () => {
    if (!checkingPayment) {
      setPaymentComplete(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Comprar {currency}
          </h2>
          <button
            onClick={handleClose}
            disabled={checkingPayment}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden min-h-0">
          {paymentComplete ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Compra exitosa!</h3>
                <p className="text-lg text-gray-600 mb-4">
                  {balanceDetected ? 'Balance actualizado correctamente' : 'Actualizando tu balance...'}
                </p>
                {checkingPayment && (
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">
                      {balanceDetected ? 'Verificando actualización...' : 'Esperando confirmación de la transacción...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <iframe
              src={BUY_TOKENS_URL}
              className="w-full h-full border-0"
              title="Comprar Stablecoins"
              allow="payment"
              style={{ minHeight: 'calc(95vh - 100px)' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

