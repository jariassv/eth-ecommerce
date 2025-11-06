'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupportedCurrency } from '@/hooks/useTokens';
import { BUY_TOKENS_URL } from '@/lib/constants';
import { useTokens } from '@/hooks/useTokens';
import { useWallet } from '@/hooks/useWallet';
import { dispatchCartUpdated } from '@/lib/cartEvents';
import { logger } from '@/lib/logger';

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

  const handlePurchaseComplete = useCallback(async () => {
    try {
      setCheckingPayment(true);
      
      // Esperar un momento para que la transacción se confirme
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Recargar tokens para reflejar el nuevo balance
      if (address && provider) {
        await loadTokens(BigInt(0), undefined);
      }
      
      // Disparar evento de actualización del carrito
      dispatchCartUpdated();
      
      // Llamar callback si existe (esto actualizará el carrito en el componente padre)
      if (onPurchaseComplete) {
        await onPurchaseComplete();
      }

      // Cerrar modal después de un breve delay para mostrar éxito
      setTimeout(() => {
        setPaymentComplete(false);
        setCheckingPayment(false);
        onClose();
      }, 2000);
    } catch (err) {
      logger.error('Error al actualizar tokens después de compra:', err);
      setCheckingPayment(false);
      setPaymentComplete(false);
      // Aún así, cerrar el modal después de un delay
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [address, provider, loadTokens, onPurchaseComplete, onClose]);

  // Detectar cuando se completa el pago usando postMessage desde el iframe
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Verificar origen por seguridad (ajustar según tu dominio)
      // Aceptar mensajes del mismo origen o de localhost:3000
      const allowedOrigins = [
        window.location.origin,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:6001',
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">¡Compra exitosa!</h3>
                <p className="text-gray-600">Actualizando tu balance...</p>
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

