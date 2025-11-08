'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Company } from '@/lib/contracts';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface CompanyMetrics {
  total: number;
  active: number;
  inactive: number;
}

export default function ContractAdminPage() {
  const { address, provider, isConnected, loading: walletLoading, connect } = useWallet();
  const {
    contract,
    getOwner,
    getCompanyCount,
    getAllCompanies,
    loading: ecommerceLoading,
    isReady,
  } = useEcommerce(provider, address);

  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      await getCompanyCount(); // ensure contract call, but result not used directly yet
      const list = await getAllCompanies();
      setCompanies(list);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar empresas';
      setError(errorMessage);
      logger.error('Error loading companies:', err);
    } finally {
      setLoadingData(false);
    }
  }, [getCompanyCount, getAllCompanies]);

  useEffect(() => {
    if (!isReady || walletLoading) {
      return;
    }

    if (!isConnected || !address) {
      setIsOwner(null);
      setOwnerAddress(null);
      setCompanies([]);
      setLoadingData(false);
      return;
    }

    const verifyOwnerAndLoad = async () => {
      try {
        setLoadingData(true);
        const owner = await getOwner();
        setOwnerAddress(owner);
        const matches = owner.toLowerCase() === address.toLowerCase();
        setIsOwner(matches);

        if (!matches) {
          setLoadingData(false);
          setCompanies([]);
          return;
        }

        await loadCompanies();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del contrato';
        setError(errorMessage);
        logger.error('Error verifying contract owner:', err);
        setLoadingData(false);
      }
    };

    void verifyOwnerAndLoad();
  }, [address, getOwner, isConnected, isReady, loadCompanies, walletLoading]);

  useEffect(() => {
    if (!contract || !isOwner) {
      return;
    }

    const handleCompanyRegistered = () => {
      loadCompanies().catch(err => logger.error('Error refreshing companies after registration:', err));
    };

    contract.on('CompanyRegistered', handleCompanyRegistered);

    return () => {
      contract.off('CompanyRegistered', handleCompanyRegistered);
    };
  }, [contract, isOwner, loadCompanies]);

  const metrics: CompanyMetrics = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(company => company.isActive).length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [companies]);

  const latestCompanies = useMemo(() => {
    return [...companies]
      .sort((a, b) => Number(b.companyId - a.companyId))
      .slice(0, 5);
  }, [companies]);

  const renderContent = () => {
    if (walletLoading || ecommerceLoading || (loadingData && isOwner === null)) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-sm">Cargando información del contrato...</p>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Conecta tu wallet</h2>
          <p className="text-gray-600 mb-6">
            Debes conectar la wallet propietaria del contrato para acceder al panel de administrador global.
          </p>
          <button
            onClick={connect}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all"
          >
            Conectar Wallet
          </button>
        </div>
      );
    }

    if (isOwner === false) {
      return (
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acceso restringido</h2>
          <p className="text-gray-600">
            Solo la wallet propietaria del contrato puede acceder al panel global de administración.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">No se pudieron cargar los datos</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadCompanies().catch(err => logger.error('Error reloading companies:', err))}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total de empresas" value={metrics.total.toString()} subtitle="Registradas en el contrato" tone="indigo" />
          <MetricCard title="Empresas activas" value={metrics.active.toString()} subtitle="Disponibles para operar" tone="green" />
          <MetricCard title="Empresas inactivas" value={metrics.inactive.toString()} subtitle="En pausa o deshabilitadas" tone="yellow" />
          <MetricCard title="Dirección del owner" value={ownerAddress ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}` : '—'} subtitle="Wallet propietaria" tone="purple" />
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Empresas registradas</h2>
              <p className="text-sm text-gray-500">Listado completo de empresas registradas en el contrato.</p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar nueva empresa
            </Link>
          </div>

          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-3"></div>
              <p className="text-sm">Cargando empresas...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              <p className="text-sm">Aún no hay empresas registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Wallet</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {companies.map(company => (
                    <tr key={company.companyId.toString()}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">#{company.companyId.toString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{company.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{company.companyAddress.slice(0, 6)}...{company.companyAddress.slice(-4)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{company.taxId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          company.isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {company.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/company/${company.companyId.toString()}`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                        >
                          Ver panel
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Últimas empresas registradas</h2>
          {latestCompanies.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no se registran empresas.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {latestCompanies.map(company => (
                <li key={company.companyId.toString()} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{company.companyAddress}</p>
                  </div>
                  <Link
                    href={`/company/${company.companyId.toString()}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                  >
                    Gestionar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <Header isContractAdmin />
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel del Contrato</h1>
          <p className="text-gray-600">
            Visualiza métricas globales, empresas registradas y administra nuevas incorporaciones directamente desde el contrato.
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  tone: 'indigo' | 'green' | 'yellow' | 'purple';
}

function MetricCard({ title, value, subtitle, tone }: MetricCardProps) {
  const styles: Record<MetricCardProps['tone'], { bg: string; border: string; text: string }> = {
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
    },
  };

  const toneStyles = styles[tone];

  return (
    <div className={`bg-white rounded-2xl shadow-md border ${toneStyles.border} p-6`}>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className={`text-3xl font-bold ${toneStyles.text} mb-1`}>{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}


