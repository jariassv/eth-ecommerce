'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';

interface TokenPurchaseProps {
  walletAddress: string | null;
  onPaymentComplete?: () => void; // Callback para refrescar balance
}

export default function TokenPurchase({ walletAddress, onPaymentComplete }: TokenPurchaseProps) {
  const [amount, setAmount] = useState<string>('');
  const [tokenType, setTokenType] = useState<'USDT' | 'EURT'>('USDT');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Solo permitir números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleCreatePayment = async () => {
    if (!walletAddress) {
      setError('Por favor conecta tu wallet primero');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Por favor ingresa una cantidad válida');
      return;
    }

    if (amountNum < 1) {
      const currency = tokenType === 'EURT' ? '€1 EUR' : '$1 USD';
      setError(`El monto mínimo es ${currency}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountNum,
          walletAddress,
          tokenType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pago');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error creating payment intent:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setClientSecret(null);
    setAmount('');
    setError(null);
    // Asegurar que se refresque el balance al cancelar también
    if (onPaymentComplete) {
      onPaymentComplete();
    }
  };

  if (!walletAddress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center">
          Por favor conecta tu wallet para comprar tokens
        </p>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Completar Pago</h2>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            amount={parseFloat(amount)}
            walletAddress={walletAddress}
            onSuccess={handleCancel}
            onCancel={handleCancel}
            onPaymentComplete={onPaymentComplete}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Comprar Tokens</h2>
      
      <div className="space-y-4">
        {/* Selector de tipo de token */}
        <div>
          <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Token
          </label>
          <select
            id="tokenType"
            value={tokenType}
            onChange={(e) => {
              setTokenType(e.target.value as 'USDT' | 'EURT');
              setError(null);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="USDT">USD Token (USDT) - Pago en USD</option>
            <option value="EURT">EUR Token (EURT) - Pago en EUR</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad ({tokenType === 'EURT' ? 'EUR' : 'USD'})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {tokenType === 'EURT' ? '€' : '$'}
            </span>
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            1 {tokenType === 'EURT' ? 'EUR' : 'USD'} = 1 {tokenType} (equivalente en tokens)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleCreatePayment}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : `Comprar ${amount || '0'} ${tokenType}`}
        </button>

        <div className="text-xs text-gray-500 text-center">
          <p>El pago se procesará de forma segura mediante Stripe</p>
          <p className="mt-1">Los tokens se acuñarán automáticamente después del pago</p>
        </div>
      </div>
    </div>
  );
}

