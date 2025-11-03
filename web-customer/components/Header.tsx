'use client';

import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { formatTokenAmount } from '@/lib/ethers';
import { useState, useEffect } from 'react';

const USD_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
  : '';

export default function Header() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [balance, setBalance] = useState<string>('0.00');

  useEffect(() => {
    if (isConnected && address && USD_TOKEN_ADDRESS) {
      loadBalance();
    }
  }, [isConnected, address]);

  const loadBalance = async () => {
    try {
      // Usar RPC proxy para obtener balance
      const response = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: USD_TOKEN_ADDRESS,
            data: '0x70a08231' + address.slice(2).padStart(64, '0'),
          }, 'latest'],
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result) {
        const balanceBigInt = BigInt(data.result);
        const formatted = formatTokenAmount(balanceBigInt, 6);
        setBalance(parseFloat(formatted).toFixed(2));
      }
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            🛒 Tienda Blockchain
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Productos
            </Link>
            <Link
              href="/cart"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Carrito
            </Link>
            <Link
              href="/orders"
              className="text-gray-700 hover:text-indigo-600 transition-colors"
            >
              Mis Pedidos
            </Link>

            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Balance USDT</p>
                  <p className="text-sm font-semibold text-indigo-600">
                    {balance} USDT
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Wallet</p>
                  <p className="text-sm font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Conectar Wallet
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

