'use client';

import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';

interface HeaderProps {
  companyName?: string;
}

export default function Header({ companyName }: HeaderProps) {
  const { address, isConnected, disconnect } = useWallet();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              {companyName && (
                <p className="text-xs text-gray-500">{companyName}</p>
              )}
            </div>
          </Link>

          {isConnected && (
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Wallet</p>
                  <p className="text-sm font-mono font-semibold text-gray-800">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

