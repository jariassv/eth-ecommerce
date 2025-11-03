'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Invoice } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import Header from '@/components/Header';
import Link from 'next/link';

export default function OrdersPage() {
  const { provider, address } = useWallet();
  const { getMyInvoices, loading } = useEcommerce(provider, address);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadInvoices();
    }
  }, [address]);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
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

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Mis Pedidos
            </h2>
            <p className="text-gray-600 mb-6">
              Por favor conecta tu wallet para ver tus pedidos
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Mis Pedidos
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loadingInvoices || loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Cargando pedidos...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No tienes pedidos aún
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const amount = formatTokenAmount(invoice.totalAmount, 6);
              return (
                <div
                  key={invoice.invoiceId.toString()}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Factura #{invoice.invoiceId.toString()}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(invoice.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-indigo-600">
                        ${amount} USDT
                      </p>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          invoice.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.isPaid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Items:</p>
                      <p className="font-medium">{invoice.itemCount.toString()}</p>
                    </div>
                    {invoice.isPaid && invoice.paymentTxHash && (
                      <div>
                        <p className="text-gray-500">TX Hash:</p>
                        <p className="font-mono text-xs break-all">
                          {invoice.paymentTxHash}
                        </p>
                      </div>
                    )}
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

