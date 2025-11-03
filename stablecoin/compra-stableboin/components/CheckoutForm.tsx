'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

interface CheckoutFormProps {
  amount: number;
  walletAddress: string;
  onSuccess: () => void;
  onCancel: () => void;
  onPaymentComplete?: () => void; // Callback cuando el pago se completa
}

export default function CheckoutForm({
  amount,
  walletAddress,
  onSuccess,
  onCancel,
  onPaymentComplete,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Error en el formulario');
        setLoading(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?payment=success&amount=${amount}&wallet=${walletAddress}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Error al procesar el pago');
      } else {
        setSuccess(true);
        
        // Notificar al componente padre que el pago se completó
        if (onPaymentComplete) {
          onPaymentComplete();
        }
        
        // El webhook se encargará del mint
        // Esperar un poco más para que el webhook procese
        setTimeout(() => {
          onSuccess();
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error processing payment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
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
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          ¡Pago Exitoso!
        </h3>
        <p className="text-gray-600 mb-4">
          Tu pago ha sido procesado. Los tokens se acuñarán en breve.
        </p>
        <p className="text-sm text-gray-500">
          Puedes cerrar esta ventana o continuar comprando.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Monto:</span>
          <span className="font-semibold">${amount.toFixed(2)} USD</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tokens a recibir:</span>
          <span className="font-semibold">{amount.toFixed(2)} USDT</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Wallet: <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

