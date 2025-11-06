'use client';

import { useState, useEffect } from 'react';
import WalletConnect from '@/components/WalletConnect';
import TokenPurchase from '@/components/TokenPurchase';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    // Verificar si hay parámetros de pago exitoso en la URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentStatus('success');
      
      // Enviar postMessage al parent window si está en un iframe
      try {
        if (window.self !== window.top) {
          const amount = params.get('amount') || '0';
          const wallet = params.get('wallet') || '';
          const tokenType = (params.get('tokenType') || 'USDT') as 'USDT' | 'EURT';
          
          window.parent.postMessage({
            type: 'payment-complete',
            payment: 'success',
            success: true,
            amount: parseFloat(amount),
            walletAddress: wallet,
            tokenType,
            source: 'url-redirect'
          }, '*');
          
          // También enviar con el tipo alternativo que espera BuyTokensModal
          window.parent.postMessage({
            type: 'TOKEN_PURCHASE_SUCCESS',
            payment: 'success',
            success: true,
            amount: parseFloat(amount),
            walletAddress: wallet,
            tokenType
          }, '*');
          
          console.log('✅ postMessage enviado desde URL redirect:', {
            type: 'payment-complete',
            amount: parseFloat(amount),
            walletAddress: wallet,
            tokenType
          });
        }
      } catch (err) {
        console.error('Error sending postMessage:', err);
      }
      
      // Limpiar la URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Compra Stablecoins
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compra tokens USDToken (USDT) o EURToken (EURT) de forma segura usando tu tarjeta de crédito.
            Los tokens se acuñarán automáticamente en tu wallet después del pago.
          </p>
        </div>

        {/* Payment Success Message */}
        {paymentStatus === 'success' && (
          <div className="max-w-md mx-auto mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-green-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  ¡Pago Procesado Exitosamente!
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  Los tokens están siendo acuñados. Deberías recibirlos en breve.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Wallet Connect Section */}
          <div>
            <WalletConnect 
              onAddressChange={setWalletAddress} 
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Token Purchase Section */}
          <div>
            <TokenPurchase 
              walletAddress={walletAddress}
              onPaymentComplete={() => {
                // Disparar refresh del balance después del pago
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              ¿Cómo funciona?
            </h2>
            <ol className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  1
                </span>
                <span>
                  <strong className="text-gray-800">Conecta tu wallet:</strong> Conecta MetaMask a la aplicación
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  2
                </span>
                <span>
                  <strong className="text-gray-800">Selecciona el token y cantidad:</strong> Elige entre USDT o EURT y especifica cuántos quieres comprar (mínimo $1 USD o €1 EUR)
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  3
                </span>
                <span>
                  <strong className="text-gray-800">Paga con tarjeta:</strong> Completa el pago de forma segura con Stripe
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  4
                </span>
                <span>
                  <strong className="text-gray-800">Recibe tus tokens:</strong> Los tokens se acuñarán automáticamente en tu wallet
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
          <p>
            Esta es una aplicación de prueba. Usa solo tarjetas de prueba de Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
