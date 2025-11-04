'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletInfo from '@/components/WalletInfo';
import PaymentProcessor from '@/components/PaymentProcessor';
import { getEcommerceContract } from '@/lib/contracts';

interface PaymentParams {
  merchant_address: string | null;
  amount: number | null;
  invoice: string | null;
  date: string | null;
  redirect: string | null;
}

export default function Home() {
  const [params, setParams] = useState<PaymentParams>({
    merchant_address: null,
    amount: null,
    invoice: null,
    date: null,
    redirect: null,
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [tokenType, setTokenType] = useState<'USDT' | 'EURT'>('USDT');
  const [errors, setErrors] = useState<string[]>([]);
  const [invoiceTokenSymbol, setInvoiceTokenSymbol] = useState<string | undefined>(undefined);
  const [invoiceTokenAddress, setInvoiceTokenAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Leer parámetros de la URL
    const searchParams = new URLSearchParams(window.location.search);
    
    const merchant = searchParams.get('merchant_address');
    const amountStr = searchParams.get('amount');
    const invoice = searchParams.get('invoice');
    const date = searchParams.get('date');
    const redirect = searchParams.get('redirect');

    const newErrors: string[] = [];

    if (!merchant || !/^0x[a-fA-F0-9]{40}$/.test(merchant)) {
      newErrors.push('Dirección del comerciante inválida o faltante');
    }

    if (!amountStr) {
      newErrors.push('Monto faltante');
    } else {
      const amountNum = parseFloat(amountStr);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.push('Monto inválido');
      }
    }

    if (!invoice) {
      newErrors.push('ID de factura faltante');
    }

    setErrors(newErrors);

    setParams({
      merchant_address: merchant,
      amount: amountStr ? parseFloat(amountStr) : null,
      invoice: invoice,
      date: date,
      redirect: redirect,
    });

    // Cargar información de la invoice para obtener el token requerido
    if (invoice && merchant) {
      loadInvoiceInfo(invoice, merchant);
    }
  }, []);

  const loadInvoiceInfo = async (invoiceId: string, merchantAddr: string) => {
    const ecommerceAddress = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
      : '';
    
    if (!ecommerceAddress || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const ecommerceContract = await getEcommerceContract(provider, ecommerceAddress);
      
      const invoiceIdNum = parseInt(invoiceId);
      if (isNaN(invoiceIdNum)) return;

      const invoiceData = await ecommerceContract.getInvoice(invoiceIdNum);
      
      const paymentToken = invoiceData.paymentToken;
      if (paymentToken && paymentToken !== '0x0000000000000000000000000000000000000000') {
        setInvoiceTokenAddress(paymentToken);
        
        // Obtener símbolo del token
        try {
          const tokenAbi = ['function symbol() external view returns (string)'];
          const tokenContract = new ethers.Contract(paymentToken, tokenAbi, provider);
          const symbol = await tokenContract.symbol();
          setInvoiceTokenSymbol(symbol);
        } catch (err) {
          console.error('Error loading token symbol:', err);
          // Intentar determinar por dirección
          const usdTokenAddress = typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
            : '';
          const eurTokenAddress = typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
            : '';
          
          if (paymentToken.toLowerCase() === usdTokenAddress.toLowerCase()) {
            setInvoiceTokenSymbol('USDT');
          } else if (paymentToken.toLowerCase() === eurTokenAddress.toLowerCase()) {
            setInvoiceTokenSymbol('EURT');
          }
        }
      }
    } catch (err) {
      console.error('Error loading invoice info:', err);
      // No mostrar error, simplemente no establecer el token
    }
  };

  if (errors.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error en Parámetros
          </h1>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            La URL debe incluir los parámetros requeridos: merchant_address, amount, invoice
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pasarela de Pagos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Completa tu pago de forma segura usando tus tokens USDT
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Wallet Info Section */}
          <div>
            <WalletInfo 
              onAddressChange={setWalletAddress}
              onBalanceChange={setBalance}
              onTokenTypeChange={setTokenType}
              invoiceTokenSymbol={invoiceTokenSymbol}
              invoiceTokenAddress={invoiceTokenAddress}
            />
          </div>

          {/* Payment Processor Section */}
          <div>
            {params.merchant_address && params.amount !== null && params.invoice && (
              <PaymentProcessor
                walletAddress={walletAddress}
                balance={balance}
                amount={params.amount}
                invoiceId={params.invoice}
                merchantAddress={params.merchant_address}
                redirectUrl={params.redirect}
                tokenType={tokenType}
                invoiceTokenSymbol={invoiceTokenSymbol}
                invoiceTokenAddress={invoiceTokenAddress}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
          <p>
            Esta es una pasarela de pagos descentralizada. Verifica todos los detalles antes de confirmar.
          </p>
        </div>
      </div>
    </div>
  );
}
