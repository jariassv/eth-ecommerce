'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getTokenAllowance } from '@/lib/ethers';
import { getEcommerceContract, getERC20Contract, Invoice } from '@/lib/contracts';
import { BUY_TOKENS_URL } from '@/lib/config';

interface PaymentProcessorProps {
  walletAddress: string | null;
  balance: string;
  amount: number;
  invoiceId: string;
  merchantAddress: string;
  redirectUrl: string | null;
  tokenType: 'USDT' | 'EURT';
  invoiceTokenSymbol?: string; // Token requerido por la invoice (desde el padre)
  invoiceTokenAddress?: string; // Dirección del token requerido (desde el padre)
}

export default function PaymentProcessor({
  walletAddress,
  balance,
  amount,
  invoiceId,
  merchantAddress,
  redirectUrl,
  tokenType,
  invoiceTokenSymbol: propInvoiceTokenSymbol,
  invoiceTokenAddress: propInvoiceTokenAddress,
}: PaymentProcessorProps) {
  const [step, setStep] = useState<'check' | 'approve' | 'pay' | 'success'>('check');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [allowance, setAllowance] = useState<string>('0.00');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  // Usar props si están disponibles, sino usar estado interno
  const [invoiceTokenSymbol, setInvoiceTokenSymbol] = useState<string>(propInvoiceTokenSymbol || 'USDT');
  const [invoiceTokenDecimals, setInvoiceTokenDecimals] = useState<number>(6);
  const [loadingInvoice, setLoadingInvoice] = useState(!propInvoiceTokenSymbol);

  const usdTokenAddress = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
    : '';
  const eurTokenAddress = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
    : '';
  const ecommerceAddress = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
    : '';

  // Actualizar invoiceTokenSymbol cuando cambie el prop
  useEffect(() => {
    if (propInvoiceTokenSymbol) {
      setInvoiceTokenSymbol(propInvoiceTokenSymbol);
      setLoadingInvoice(false);
    }
  }, [propInvoiceTokenSymbol]);

  // Cargar invoice para obtener el paymentToken (solo si no se pasó como prop)
  useEffect(() => {
    if (ecommerceAddress && invoiceId && !propInvoiceTokenSymbol) {
      loadInvoice();
    }
  }, [ecommerceAddress, invoiceId, propInvoiceTokenSymbol]);

  // Determinar paymentTokenAddress desde props, invoice, o usar USDT por defecto
  const paymentTokenAddress = propInvoiceTokenAddress 
    ? propInvoiceTokenAddress
    : (invoice?.paymentToken && invoice.paymentToken !== '0x0000000000000000000000000000000000000000'
      ? invoice.paymentToken
      : usdTokenAddress);

  useEffect(() => {
    // Si tenemos paymentTokenAddress (ya sea de props o de invoice), podemos cargar la info
    if (walletAddress && paymentTokenAddress && ecommerceAddress) {
      loadTokenInfo();
      // Solo verificar allowance si tenemos invoice o si tenemos el token desde props
      if (invoice || propInvoiceTokenAddress) {
        checkAllowance();
      }
    }
  }, [walletAddress, paymentTokenAddress, ecommerceAddress, invoice, propInvoiceTokenAddress]);

  const loadInvoice = async () => {
    if (!window.ethereum || !ecommerceAddress) return;

    setLoadingInvoice(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const ecommerceContract = await getEcommerceContract(provider, ecommerceAddress);
      
      const invoiceIdNum = parseInt(invoiceId);
      if (isNaN(invoiceIdNum)) {
        throw new Error('ID de factura inválido');
      }

      const invoiceData = await ecommerceContract.getInvoice(invoiceIdNum);
      
      // Convertir a formato Invoice
      const invoiceObj: Invoice = {
        invoiceId: BigInt(invoiceData.invoiceId.toString()),
        companyId: BigInt(invoiceData.companyId.toString()),
        customerAddress: invoiceData.customerAddress,
        totalAmount: BigInt(invoiceData.totalAmount.toString()),
        timestamp: BigInt(invoiceData.timestamp.toString()),
        isPaid: invoiceData.isPaid,
        paymentTxHash: invoiceData.paymentTxHash,
        itemCount: BigInt(invoiceData.itemCount.toString()),
        paymentToken: invoiceData.paymentToken || '0x0000000000000000000000000000000000000000',
        expectedTotalUSDT: BigInt(invoiceData.expectedTotalUSDT?.toString() || '0'),
      };

      setInvoice(invoiceObj);
    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setError('Error al cargar información de la factura: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadTokenInfo = async () => {
    if (!window.ethereum || !paymentTokenAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = getERC20Contract(provider, paymentTokenAddress);
      
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      setInvoiceTokenSymbol(symbol);
      setInvoiceTokenDecimals(Number(decimals));
    } catch (err) {
      console.error('Error loading token info:', err);
      // Usar valores por defecto
      setInvoiceTokenSymbol('USDT');
      setInvoiceTokenDecimals(6);
    }
  };

  const checkAllowance = async () => {
    if (!walletAddress || !paymentTokenAddress || !ecommerceAddress) return;

    try {
      // Usar el token de la invoice, no el seleccionado
      const allowanceValue = await getTokenAllowance(
        paymentTokenAddress,
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
    if (!window.ethereum || !walletAddress || !paymentTokenAddress || !ecommerceAddress) {
      setError('Wallet no conectada o contratos no configurados');
      return;
    }

    // Validar que el token seleccionado coincide con el token de la invoice
    const selectedTokenAddress = tokenType === 'USDT' ? usdTokenAddress : eurTokenAddress;
    if (selectedTokenAddress.toLowerCase() !== paymentTokenAddress.toLowerCase()) {
      setError(`Esta factura debe pagarse con ${invoiceTokenSymbol}. Por favor, cambia a ${invoiceTokenSymbol} en el selector.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tokenAbi = [
        'function approve(address spender, uint256 amount) external returns (bool)',
      ];
      const tokenContract = new ethers.Contract(paymentTokenAddress, tokenAbi, signer);

      // Convertir amount a unidades base usando los decimales del token
      const amountInUnits = ethers.parseUnits(amount.toString(), invoiceTokenDecimals);

      // Aprobar una cantidad grande para evitar múltiples aprobaciones
      const approveAmount = ethers.parseUnits('1000000', invoiceTokenDecimals);

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

  // Validar que el token seleccionado coincide con el token de la invoice
  const selectedTokenAddress = tokenType === 'USDT' ? usdTokenAddress : eurTokenAddress;
  const tokenMismatch = invoice && selectedTokenAddress.toLowerCase() !== paymentTokenAddress.toLowerCase();

  if (loadingInvoice) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando información de la factura...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error al cargar factura</p>
          <p className="text-sm">{error || 'No se pudo cargar la información de la factura'}</p>
        </div>
      </div>
    );
  }

  if (invoice.isPaid) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          <p className="font-semibold">Factura ya pagada</p>
          <p className="text-sm">Esta factura ya fue procesada.</p>
          {invoice.paymentTxHash && (
            <p className="text-xs font-mono mt-2 break-all">TX: {invoice.paymentTxHash}</p>
          )}
        </div>
      </div>
    );
  }

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
              <span className="font-semibold text-lg">
                {invoiceTokenSymbol === 'EURT' ? '€' : '$'}{amount.toFixed(2)} {invoiceTokenSymbol}
              </span>
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
                {balance} {tokenType}
              </span>
            </div>
            {tokenMismatch && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-yellow-600">⚠ Token requerido:</span>
                <span className="text-xs font-semibold text-yellow-600">{invoiceTokenSymbol}</span>
              </div>
            )}
          </div>
        </div>

        {tokenMismatch && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="text-sm font-semibold mb-1">⚠️ Token incorrecto</p>
            <p className="text-xs">
              Esta factura debe pagarse con {invoiceTokenSymbol}. 
              Por favor, cambia a {invoiceTokenSymbol} en el selector arriba.
            </p>
          </div>
        )}

        {hasInsufficientBalance && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold mb-1">Saldo insuficiente</p>
            <p className="text-sm">
              Necesitas {amount.toFixed(2)} {tokenType} pero tienes {balance} {tokenType}.
            </p>
            <a
              href={BUY_TOKENS_URL}
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
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            <p className="text-sm font-semibold mb-2">
              ⚠️ Aprobación de Tokens Requerida
            </p>
            <p className="text-sm mb-2">
              Para realizar el pago, primero necesitas autorizar al contrato Ecommerce a gastar tus tokens {invoiceTokenSymbol}. 
              Esto es un paso de seguridad estándar en blockchain.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Aprobación actual: {allowance} {invoiceTokenSymbol} | Necesario: {invoiceTokenSymbol === 'EURT' ? '€' : '$'}{amount.toFixed(2)} {invoiceTokenSymbol}
            </p>
            <p className="text-xs text-blue-600 mt-1 italic">
              Nota: Solo necesitas aprobar una vez. Las próximas compras serán más rápidas.
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
          <div>
            <button
              onClick={handlePay}
              disabled={loading || tokenMismatch}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando pago...' : `Pagar ${invoiceTokenSymbol === 'EURT' ? '€' : '$'}${amount.toFixed(2)} ${invoiceTokenSymbol}`}
            </button>
            {tokenMismatch && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Por favor cambia a {invoiceTokenSymbol} para procesar el pago
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

