'use client';

import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { formatTokenAmount } from '@/lib/ethers';
import { useState, useEffect } from 'react';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useTokens, SupportedCurrency } from '@/hooks/useTokens';

const USD_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
  : '';

export default function Header() {
  const { provider, address, isConnected, connect, disconnect } = useWallet();
  const { getCart, isReady } = useEcommerce(provider, address);
  const { tokens, getSelectedToken, selectedCurrency, setSelectedCurrency } = useTokens(provider, address);
  const [cartCount, setCartCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  // Cerrar selector cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCurrencySelector && !target.closest('.currency-selector-container')) {
        setShowCurrencySelector(false);
      }
    };

    if (showCurrencySelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCurrencySelector]);

  useEffect(() => {
    if (isConnected && address && isReady) {
      loadCartCount();
      const interval = setInterval(loadCartCount, 3000);
      return () => clearInterval(interval);
    } else {
      setCartCount(0);
    }
  }, [isConnected, address, isReady]);

  const loadCartCount = async () => {
    try {
      const cart = await getCart();
      const total = cart.reduce((sum, item) => sum + Number(item.quantity), 0);
      setCartCount(total);
    } catch (err) {
      // Ignorar errores si no hay items o contrato no está listo
      setCartCount(0);
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:shadow-xl group-hover:shadow-indigo-500/50 transition-all">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Blockchain Market
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Tu tienda descentralizada</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium"
            >
              Productos
            </Link>
            <Link
              href="/cart"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium relative"
            >
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors font-medium"
            >
              Mis Pedidos
            </Link>
          </nav>

          {/* Wallet Section */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg relative currency-selector-container">
                  <div className="text-right border-r border-gray-200 pr-4">
                    <p className="text-xs text-gray-500 font-medium">Balance</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCurrencySelector(!showCurrencySelector)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        {(() => {
                          const token = getSelectedToken();
                          if (token) {
                            return `${token.balanceFormatted} ${selectedCurrency}`;
                          }
                          return `0.00 ${selectedCurrency}`;
                        })()}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {showCurrencySelector && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                        <button
                          onClick={() => {
                            setSelectedCurrency('USDT');
                            setShowCurrencySelector(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg ${
                            selectedCurrency === 'USDT' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>USDT</span>
                            {selectedCurrency === 'USDT' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCurrency('EURT');
                            setShowCurrencySelector(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg ${
                            selectedCurrency === 'EURT' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>EURT</span>
                            {selectedCurrency === 'EURT' && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
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
              </>
            ) : (
              <button
                onClick={connect}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105"
              >
                Conectar Wallet
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setShowCurrencySelector(false);
              }}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <Link
              href="/"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCurrencySelector(false);
              }}
            >
              Productos
            </Link>
            <Link
              href="/cart"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors relative"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCurrencySelector(false);
              }}
            >
              Carrito {cartCount > 0 && `(${cartCount})`}
            </Link>
            <Link
              href="/orders"
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowCurrencySelector(false);
              }}
            >
              Mis Pedidos
            </Link>
            {isConnected && (
              <div className="px-4 py-2 space-y-2 currency-selector-container">
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500">Balance:</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCurrencySelector(!showCurrencySelector)}
                        className="text-indigo-600 font-semibold flex items-center gap-1"
                      >
                        {(() => {
                          const token = getSelectedToken();
                          if (token) {
                            return `${token.balanceFormatted} ${selectedCurrency}`;
                          }
                          return `0.00 ${selectedCurrency}`;
                        })()}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {showCurrencySelector && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg mt-2 mb-2">
                      <button
                        onClick={() => {
                          setSelectedCurrency('USDT');
                          setShowCurrencySelector(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-t-lg ${
                          selectedCurrency === 'USDT' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>USDT</span>
                          {selectedCurrency === 'USDT' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCurrency('EURT');
                          setShowCurrencySelector(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 rounded-b-lg ${
                          selectedCurrency === 'EURT' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>EURT</span>
                          {selectedCurrency === 'EURT' && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                  <p className="text-gray-500 font-mono text-xs mt-1">{address}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

