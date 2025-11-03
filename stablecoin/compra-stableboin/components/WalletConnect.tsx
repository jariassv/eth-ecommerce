'use client';

import { useState, useEffect } from 'react';
import { connectWallet, getTokenBalance } from '@/lib/ethers';
import { formatTokenAmount } from '@/lib/ethers';

interface WalletConnectProps {
  onAddressChange: (address: string | null) => void;
  refreshTrigger?: number; // Número que al cambiar dispara un refresh
}

export default function WalletConnect({ onAddressChange, refreshTrigger }: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string>('0.00');
  const [eurtBalance, setEurtBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usdTokenAddress = process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '';
  const eurTokenAddress = process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '';

  useEffect(() => {
    // Verificar si hay una cuenta conectada
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum as any;
      if (ethereum.on) {
        ethereum.on('accountsChanged', handleAccountsChanged);
      }
      checkConnectedAccount();
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const ethereum = window.ethereum as any;
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (address && (usdTokenAddress || eurTokenAddress)) {
      // Cuando refreshTrigger cambia, forzar un refresh inmediato
      console.log(`🔄 RefreshTrigger cambió a: ${refreshTrigger}`);
      loadBalances(true); // Forzar refresh con blockTag 'latest'
    }
  }, [address, usdTokenAddress, eurTokenAddress, refreshTrigger]); // Refrescar cuando cambia refreshTrigger

  useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAddress(null);
      setUsdtBalance('0.00');
      setEurtBalance('0.00');
    } else {
      setAddress(accounts[0]);
    }
  };

  const checkConnectedAccount = async () => {
    try {
      if (!window.ethereum) return;

      const provider = await import('ethers').then(m => 
        new m.ethers.BrowserProvider(window.ethereum!)
      );
      const accounts = await provider.send('eth_accounts', []);
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      console.error('Error checking connected account:', err);
    }
  };

  const loadBalances = async (forceRefresh: boolean = false) => {
    if (!address) return;

    try {
      console.log(`🔄 Refrescando balances para: ${address}`);
      setError(null);
      
      // Cargar balance de USDT
      if (usdTokenAddress) {
        try {
          const usdtBalanceValue = await getTokenBalance(usdTokenAddress, address, forceRefresh);
          console.log(`💰 Balance USDT: ${usdtBalanceValue}`);
          setUsdtBalance(formatTokenAmount(usdtBalanceValue));
        } catch (err) {
          console.error('Error cargando balance USDT:', err);
          setUsdtBalance('0.00');
        }
      }
      
      // Cargar balance de EURT
      if (eurTokenAddress) {
        try {
          const eurtBalanceValue = await getTokenBalance(eurTokenAddress, address, forceRefresh);
          console.log(`💰 Balance EURT: ${eurtBalanceValue}`);
          setEurtBalance(formatTokenAmount(eurtBalanceValue));
        } catch (err) {
          console.error('Error cargando balance EURT:', err);
          setEurtBalance('0.00');
        }
      }
    } catch (err) {
      console.error('❌ Error loading balances:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar balances: ${errorMessage}`);
    }
  };

  // Función pública para refrescar balance (usada desde el componente padre)
  const refreshBalance = () => {
    if (address) {
      loadBalances(true); // Forzar refresh con blockTag 'latest'
    }
  };

  // Exponer refreshBalance al componente padre usando useEffect
  useEffect(() => {
    if (address) {
      // Refrescar balances cada 3 segundos mientras hay una dirección
      const interval = setInterval(() => {
        loadBalances(false);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [address, usdTokenAddress, eurTokenAddress]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const connectedAddress = await connectWallet();
      setAddress(connectedAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    setUsdtBalance('0.00');
    setEurtBalance('0.00');
    setError(null);
  };

  if (!address) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Conectar Wallet</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Conectando...' : 'Conectar MetaMask'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Wallet Conectada</h2>
      
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">Verifica que Anvil esté corriendo en http://localhost:8545</p>
        </div>
      )}
      
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Dirección:</p>
          <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
            {address}
          </p>
        </div>
        
        <div className="space-y-3">
          {usdTokenAddress && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Balance USDT:</p>
              <p className="text-xl font-bold text-indigo-600">
                {usdtBalance} USDT
              </p>
            </div>
          )}
          {eurTokenAddress && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Balance EURT:</p>
              <p className="text-xl font-bold text-indigo-600">
                {eurtBalance} EURT
              </p>
            </div>
          )}
          {!usdTokenAddress && !eurTokenAddress && (
            <p className="text-sm text-gray-500">No hay contratos configurados</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => loadBalances(true)}
          disabled={loading}
          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Cargando...' : '🔄 Refrescar'}
        </button>
        <button
          onClick={handleDisconnect}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Desconectar
        </button>
      </div>
    </div>
  );
}

