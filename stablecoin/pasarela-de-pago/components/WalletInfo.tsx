'use client';

import { useState, useEffect } from 'react';
import { connectWallet, getTokenBalance } from '@/lib/ethers';
import { formatTokenAmount } from '@/lib/ethers';

interface WalletInfoProps {
  onAddressChange: (address: string | null) => void;
  onBalanceChange: (balance: string) => void;
  onTokenTypeChange?: (tokenType: 'USDT' | 'EURT') => void;
  invoiceTokenSymbol?: string; // Token requerido por la invoice
  invoiceTokenAddress?: string; // Dirección del token requerido
}

export default function WalletInfo({ 
  onAddressChange, 
  onBalanceChange, 
  onTokenTypeChange,
  invoiceTokenSymbol,
  invoiceTokenAddress,
}: WalletInfoProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar con el token de la invoice si está disponible
  const getInitialTokenType = (): 'USDT' | 'EURT' => {
    if (invoiceTokenSymbol === 'EURT') return 'EURT';
    return 'USDT';
  };
  
  const [tokenType, setTokenType] = useState<'USDT' | 'EURT'>(getInitialTokenType());

  const usdTokenAddress = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
    : '';
  const eurTokenAddress = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
    : '';

  useEffect(() => {
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
    if (address) {
      loadBalance();
    }
  }, [address, invoiceTokenAddress, tokenType, usdTokenAddress, eurTokenAddress]);

  useEffect(() => {
    onAddressChange(address);
    onBalanceChange(balance);
  }, [address, balance, onAddressChange, onBalanceChange]);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAddress(null);
      setBalance('0.00');
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

  const loadBalance = async () => {
    if (!address) return;
    
    // Usar el token de la invoice si está disponible, sino usar el seleccionado
    const tokenAddress = invoiceTokenAddress 
      ? invoiceTokenAddress 
      : (tokenType === 'EURT' ? eurTokenAddress : usdTokenAddress);
    
    if (!tokenAddress) return;

    try {
      const balanceValue = await getTokenBalance(tokenAddress, address, true);
      const formatted = formatTokenAmount(balanceValue);
      setBalance(formatted);
    } catch (err) {
      console.error('Error loading balance:', err);
      setError('Error al cargar balance');
    }
  };
  
  // Actualizar tokenType cuando cambie invoiceTokenSymbol o invoiceTokenAddress
  useEffect(() => {
    if (invoiceTokenSymbol) {
      const newTokenType = invoiceTokenSymbol === 'EURT' ? 'EURT' : 'USDT';
      if (newTokenType !== tokenType) {
        setTokenType(newTokenType);
        // Recargar balance cuando cambie el tokenType
        if (address) {
          loadBalance();
        }
      }
    } else if (invoiceTokenAddress) {
      // Si tenemos la dirección pero no el símbolo, intentar determinar por dirección
      const usdTokenAddress = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
        : '';
      const eurTokenAddress = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
        : '';
      
      if (invoiceTokenAddress.toLowerCase() === eurTokenAddress.toLowerCase()) {
        if (tokenType !== 'EURT') {
          setTokenType('EURT');
          if (address) {
            loadBalance();
          }
        }
      } else if (invoiceTokenAddress.toLowerCase() === usdTokenAddress.toLowerCase()) {
        if (tokenType !== 'USDT') {
          setTokenType('USDT');
          if (address) {
            loadBalance();
          }
        }
      }
    }
  }, [invoiceTokenSymbol, invoiceTokenAddress, tokenType, address]);

  useEffect(() => {
    if (onTokenTypeChange) {
      onTokenTypeChange(tokenType);
    }
  }, [tokenType, onTokenTypeChange]);

  useEffect(() => {
    if (address) {
      loadBalance();
    }
  }, [tokenType, address, invoiceTokenAddress]);

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
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600 mb-1">Dirección:</p>
          <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
            {address}
          </p>
        </div>
        
        <div className="space-y-3">
          <div>
            <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700 mb-2">
              Moneda de Pago
              {invoiceTokenSymbol && (
                <span className="ml-2 text-xs text-gray-500">
                  (Requerido: {invoiceTokenSymbol})
                </span>
              )}
            </label>
            <select
              id="tokenType"
              value={tokenType}
              onChange={(e) => {
                setTokenType(e.target.value as 'USDT' | 'EURT');
                setBalance('0.00');
              }}
              disabled={!!invoiceTokenAddress} // Deshabilitar si hay token requerido
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="USDT">USD Token (USDT)</option>
              <option value="EURT">EUR Token (EURT)</option>
            </select>
            {invoiceTokenAddress && invoiceTokenSymbol && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠ Esta factura debe pagarse con {invoiceTokenSymbol}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Balance {tokenType}:</p>
            <p className="text-lg font-bold text-indigo-600">
              {balance} {tokenType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

