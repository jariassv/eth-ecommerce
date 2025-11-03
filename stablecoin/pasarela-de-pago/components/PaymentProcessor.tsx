'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenAllowance } from '@/lib/ethers';

interface PaymentProcessorProps {
  walletAddress: string | null;
  balance: string;
  amount: number;
  invoiceId: string;
  merchantAddress: string;
  redirectUrl: string | null;
}

export default function PaymentProcessor({
  walletAddress,
  balance,
  amount,
  invoiceId,
  merchantAddress,
  redirectUrl,
}: PaymentProcessorProps) {
  const [step, setStep] = useState<'check' | 'approve' | 'pay' | 'success'>('check');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<string>('0.00');

  const usdTokenAddress = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
    : '';
  const ecommerceAddress = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
    : '';

  useEffect(() => {
    if (walletAddress && usdTokenAddress && ecommerceAddress) {
      checkAllowance();
    }
  }, [walletAddress, usdTokenAddress, ecommerceAddress]);

  const checkAllowance = async () => {
    if (!walletAddress || !usdTokenAddress || !ecommerceAddress) return;

    try {
      const allowanceValue = await getTokenAllowance(
        usdTokenAddress,
        walletAddress,
        ecommerceAddress
      );
      setAllowance(parseFloat(allowanceValue).toFixed(2));

      const amountFloat = parseFloat(amount.toString());
      const allowanceFloat = parseFloat(allowanceValue);

      if (allowanceFloat >= amountFloat) {
        setStep('pay');
      } else {
        setStep('approve');
      }
    } catch (err) {
      console.error('Error checking allowance:', err);
      setError('Error al verificar aprobación de tokens');
    }
  };

  const handleApprove = async () => {
    if (!window.ethereum || !walletAddress || !usdTokenAddress || !ecommerceAddress) {
      setError('Wallet no conectada o contratos no configurados');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // ABI mínimo para approve
      const tokenAbi = [
        'function approve(address spender, uint256 amount) external returns (bool)',
      ];
      const tokenContract = new ethers.Contract(usdTokenAddress, tokenAbi, signer);

      // Convertir amount a unidades base (6 decimales)
      const amountInUnits = ethers.parseUnits(amount.toString(), 6);

      // Aprobar una cantidad grande para evitar múltiples aprobaciones
      const approveAmount = ethers.parseUnits('1000000', 6); // 1M USDT máximo

      const tx = await tokenContract.approve(ecommerceAddress, approveAmount);
      await tx.wait();

      setStep('pay');
      await checkAllowance();
    } catch (err: any) {
      console.error('Error approving tokens:', err);
      if (err.code === 4001) {
        setError('Transacción rechazada por el usuario');
      } else {
        setError('Error al aprobar tokens: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!window.ethereum || !walletAddress || !ecommerceAddress) {
      setError('Wallet no conectada o contrato no configurado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ABI mínimo para processPayment
      const ecommerceAbi = [
        'function processPayment(uint256 invoiceId) external returns (bool)',
      ];
      const ecommerceContract = new ethers.Contract(ecommerceAddress, ecommerceAbi, signer);

      const invoiceIdNum = parseInt(invoiceId);
      if (isNaN(invoiceIdNum)) {
        throw new Error('ID de factura inválido');
      }

      const tx = await ecommerceContract.processPayment(invoiceIdNum);
      const receipt = await tx.wait();

      setTxHash(tx.hash);
      setStep('success');

      // Redirigir después de 3 segundos
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl + `?status=success&tx=${tx.hash}&invoice=${invoiceId}`;
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      if (err.code === 4001) {
        setError('Transacción rechazada por el usuario');
      } else if (err.reason) {
        setError(`Error: ${err.reason}`);
      } else {
        setError('Error al procesar el pago: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const balanceFloat = parseFloat(balance);
  const amountFloat = parseFloat(amount.toString());
  const hasInsufficientBalance = balanceFloat < amountFloat;

  if (!walletAddress) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center">
          Por favor conecta tu wallet para proceder con el pago
        </p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
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
            Tu pago ha sido procesado correctamente.
          </p>
          {txHash && (
            <p className="text-sm text-gray-500 mb-4 font-mono break-all">
              TX: {txHash}
            </p>
          )}
          {redirectUrl && (
            <p className="text-sm text-gray-500">
              Redirigiendo...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Detalles del Pago</h2>
      
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Monto a pagar:</span>
              <span className="font-semibold text-lg">${amount.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Factura:</span>
              <span className="font-mono text-sm">{invoiceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Comerciante:</span>
              <span className="font-mono text-xs break-all">{merchantAddress.slice(0, 6)}...{merchantAddress.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tu balance:</span>
              <span className={hasInsufficientBalance ? 'text-red-600 font-semibold' : 'text-gray-800'}>
                {balance} USDT
              </span>
            </div>
          </div>
        </div>

        {hasInsufficientBalance && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold mb-1">Saldo insuficiente</p>
            <p className="text-sm">
              Necesitas {amount.toFixed(2)} USDT pero tienes {balance} USDT.
            </p>
            <a
              href="http://localhost:3000"
              target="_blank"
              className="text-sm underline mt-2 inline-block"
            >
              Comprar más tokens →
            </a>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {step === 'approve' && !hasInsufficientBalance && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            <p className="text-sm">
              Necesitas aprobar el gasto de tokens antes de proceder con el pago.
            </p>
            <p className="text-xs mt-1">
              Aprobación actual: {allowance} USDT
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {step === 'approve' && !hasInsufficientBalance && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Aprobar Tokens'}
          </button>
        )}

        {step === 'pay' && !hasInsufficientBalance && (
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando pago...' : `Pagar $${amount.toFixed(2)} USDT`}
          </button>
        )}
      </div>
    </div>
  );
}

