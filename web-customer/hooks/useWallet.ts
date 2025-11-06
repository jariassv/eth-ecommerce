'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getProvider } from '@/lib/ethers';
import { logger } from '@/lib/logger';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectedAccount();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum as any;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          setProvider(null);
        } else {
          setAddress(accounts[0]);
          if (window.ethereum) {
            setProvider(new ethers.BrowserProvider(window.ethereum));
          }
        }
      };

      const handleChainChanged = () => {
        // Recargar la página cuando cambia la red
        window.location.reload();
      };

      if (ethereum.on) {
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
      }

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnectedAccount = async () => {
    try {
      if (!window.ethereum) return;

      const provider = await getProvider();
      if (!provider) return;

      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setProvider(provider);
      }
    } catch (err) {
      console.error('Error checking connected account:', err);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const connectedAddress = await connectWallet();
      setAddress(connectedAddress);
      
      const providerInstance = await getProvider();
      if (providerInstance) {
        setProvider(providerInstance);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al conectar wallet';
      setError(errorMessage);
      logger.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setError(null);
  };

  return {
    address,
    provider,
    isConnected: !!address,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}

