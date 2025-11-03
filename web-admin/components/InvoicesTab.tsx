'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Invoice } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';

interface InvoicesTabProps {
  companyId: bigint;
}

export default function InvoicesTab({ companyId }: InvoicesTabProps) {
  const { address } = useWallet();
  const { getCompanyInvoices, loading } = useEcommerce(null, address);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, [companyId]);

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const companyInvoices = await getCompanyInvoices(companyId);
      setInvoices(companyInvoices);
    } catch (err) {
      console.error('Error loading invoices:', err);
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

  if (loadingInvoices || loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Cargando facturas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Facturas ({invoices.length})
        </h2>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No hay facturas aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.invoiceId.toString()}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Factura #{invoice.invoiceId.toString()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(invoice.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600 mb-1">
                    ${formatTokenAmount(invoice.totalAmount, 6)}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice.isPaid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.isPaid ? 'Pagada' : 'Pendiente'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cliente</p>
                  <p className="text-sm font-mono text-gray-900">
                    {invoice.customerAddress.slice(0, 6)}...{invoice.customerAddress.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Items</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {invoice.itemCount.toString()} productos
                  </p>
                </div>
              </div>

              {invoice.isPaid && invoice.paymentTxHash && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Transacción</p>
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {invoice.paymentTxHash}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

