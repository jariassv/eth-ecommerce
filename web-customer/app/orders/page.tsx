'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Invoice } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import Header from '@/components/Header';
import Link from 'next/link';

// Helper para obtener la dirección de EURT (consistente con useTokens)
const EUR_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '').toLowerCase()
  : '';

export default function OrdersPage() {
  const { provider, address, isConnected } = useWallet();
  const { getMyInvoices, loading, isReady } = useEcommerce(provider, address);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (isConnected && address && isReady) {
      loadInvoices();
    } else if (!isConnected || !address) {
      setLoadingInvoices(false);
      setInvoices([]);
    }
  }, [isConnected, address, isReady]);

  const loadInvoices = async () => {
    if (!isConnected || !address || !isReady) {
      setLoadingInvoices(false);
      return;
    }

    setLoadingInvoices(true);
    setError(null);
    try {
      const allInvoices = await getMyInvoices();
      // Ordenar por timestamp descendente (más recientes primero)
      allInvoices.sort((a, b) => {
        if (b.timestamp > a.timestamp) return 1;
        if (b.timestamp < a.timestamp) return -1;
        return 0;
      });
      setInvoices(allInvoices);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Error al cargar facturas');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <Header />
        <main className="container mx-auto px-4 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Mis Pedidos
            </h2>
            <p className="text-gray-600 mb-6">
              Por favor conecta tu wallet para ver tus pedidos
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar Productos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <Header />
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mis Pedidos
          </h1>
          <p className="text-gray-600">
            Historial completo de tus compras
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loadingInvoices || loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">Cargando pedidos...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-20 w-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes pedidos aún
            </h3>
            <p className="text-gray-600 mb-6">
              Realiza tu primera compra para ver tus pedidos aquí
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              // Determinar la moneda de pago
              const invoicePaymentToken = (invoice.paymentToken || '').toLowerCase();
              
              // Si paymentToken es address(0) o vacío, asumimos USDT (facturas antiguas)
              let paymentCurrency: 'USDT' | 'EURT' = 'USDT';
              
              if (invoicePaymentToken && invoicePaymentToken !== '0x0000000000000000000000000000000000000000') {
                // Comparar con la dirección de EURT
                if (EUR_TOKEN_ADDRESS && invoicePaymentToken === EUR_TOKEN_ADDRESS) {
                  paymentCurrency = 'EURT';
                }
              }
              
              const amount = formatTokenAmount(invoice.totalAmount, 6);
              const currencySymbol = paymentCurrency === 'EURT' ? '€' : '$';
              
              return (
                <div
                  key={invoice.invoiceId.toString()}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Factura #{invoice.invoiceId.toString()}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(invoice.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {currencySymbol}{amount}
                        </p>
                        <p className="text-sm text-gray-500">{paymentCurrency}</p>
                        <span
                          className={`inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${
                            invoice.isPaid
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {invoice.isPaid ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Pagado
                            </span>
                          ) : (
                            'Pendiente de Pago'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Items</p>
                        <p className="font-semibold text-gray-900">{invoice.itemCount.toString()} productos</p>
                      </div>
                      {invoice.isPaid && invoice.paymentTxHash && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 font-medium mb-1">Transacción</p>
                          <p className="font-mono text-xs break-all text-gray-700 bg-gray-50 p-2 rounded">
                            {invoice.paymentTxHash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

