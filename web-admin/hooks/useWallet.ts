'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getProvider } from '@/lib/ethers';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnectedAccount();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum as any;
      
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null);
          setProvider(null);
          setIsConnected(false);
        } else {
          setAddress(accounts[0]);
          if (window.ethereum) {
            setProvider(new ethers.BrowserProvider(window.ethereum));
          }
          setIsConnected(true);
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
    } else {
      setLoading(false);
    }
  }, []);

  const checkConnectedAccount = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setLoading(false);
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        setAddress(accounts[0].address);
        setProvider(provider);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error checking connected account:', err);
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    try {
      const account = await connectWallet();
      setAddress(account);
      const providerInstance = await getProvider();
      setProvider(providerInstance);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      throw err;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setIsConnected(false);
  };

  return {
    address,
    provider,
    isConnected,
    loading,
    connect,
    disconnect,
  };
}

