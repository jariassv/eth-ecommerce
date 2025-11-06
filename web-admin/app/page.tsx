'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { logger } from '@/lib/logger';
import Link from 'next/link';

export default function Home() {
  const { address, provider, isConnected, connect } = useWallet();
  const { getCompanyIdByAddress, getOwner, isReady } = useEcommerce(provider, address);
  const [companyId, setCompanyId] = useState<bigint | null>(null);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address && isReady) {
      checkCompany();
      // Solo verificar owner si el contrato está listo
      checkIfOwner();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, isReady]);

  const checkIfOwner = async () => {
    if (!isReady) {
      setIsOwner(false);
      return;
    }
    
    try {
      const owner = await getOwner();
      setIsOwner(owner.toLowerCase() === address?.toLowerCase());
    } catch (err) {
      logger.error('Error checking owner:', err);
      setIsOwner(false);
      // No mostrar error al usuario si es solo un problema de configuración
    }
  };

  const checkCompany = async () => {
    try {
      const id = await getCompanyIdByAddress(address!);
      if (id > 0n) {
        setCompanyId(id);
        // Redirigir automáticamente después de un breve delay
        setTimeout(() => {
          router.push(`/company/${id.toString()}`);
        }, 1500);
      }
    } catch (err) {
      // No tiene empresa registrada
      setCompanyId(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mb-6">
            Conecta tu wallet para gestionar tu empresa
          </p>
          <button
            onClick={connect}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all transform hover:scale-105"
          >
            Conectar Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            {companyId === null ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  No tienes una empresa registrada
                </h1>
                {isOwner ? (
                  <>
                    <p className="text-gray-600 mb-6">
                      Como propietario del contrato, puedes registrar una nueva empresa para cualquier dirección.
                    </p>
                    <Link
                      href="/register"
                      className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Registrar Nueva Empresa
                    </Link>
                  </>
                ) : (
                  <p className="text-gray-600 mb-6">
                    Solo el propietario del contrato puede registrar empresas. Si eres el propietario, puedes registrar una empresa para cualquier dirección.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Empresa registrada
                </h1>
                <p className="text-gray-600 mb-6">
                  Redirigiendo a tu panel de gestión...
                </p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
