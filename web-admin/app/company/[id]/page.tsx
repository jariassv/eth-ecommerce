'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import Header from '@/components/Header';
import Link from 'next/link';
import ProductsTab from '@/components/ProductsTab';
import InvoicesTab from '@/components/InvoicesTab';

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { getCompany, getCompanyIdByAddress, loading, isReady } = useEcommerce(null, address);
  
  const companyId = BigInt(params.id as string);
  const [company, setCompany] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'invoices'>('products');
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    if (isReady && companyId) {
      loadCompany();
    }
  }, [isReady, companyId]);

  useEffect(() => {
    if (company && address) {
      checkOwnership();
    }
  }, [company, address]);

  const loadCompany = async () => {
    try {
      const companyData = await getCompany(companyId);
      setCompany(companyData);
    } catch (err) {
      console.error('Error loading company:', err);
    } finally {
      setLoadingCompany(false);
    }
  };

  const checkOwnership = async () => {
    if (!address || !company) {
      setIsOwner(false);
      return;
    }
    
    // Verificar si la dirección del usuario coincide con la dirección de la empresa
    const userIsOwner = address.toLowerCase() === company.companyAddress.toLowerCase();
    setIsOwner(userIsOwner);
    
    // Si no es el owner, redirigir
    if (!userIsOwner) {
      router.push('/');
    }
  };

  if (loadingCompany || loading || isOwner === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Cargando empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company || !isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta empresa.</p>
            <Link href="/" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <Header companyName={company.name} />
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header de la empresa */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>ID: {company.companyId.toString()}</span>
                <span>•</span>
                <span className="font-mono">{company.companyAddress.slice(0, 6)}...{company.companyAddress.slice(-4)}</span>
                <span>•</span>
                <span>Tax ID: {company.taxId}</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              company.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {company.isActive ? 'Activa' : 'Inactiva'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'invoices'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Facturas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'products' && <ProductsTab companyId={companyId} />}
            {activeTab === 'invoices' && <InvoicesTab companyId={companyId} />}
          </div>
        </div>
      </main>
    </div>
  );
}

