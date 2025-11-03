'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import CartPreviewModal from './CartPreviewModal';

export default function FloatingCartButton() {
  const { address, provider, isConnected } = useWallet();
  const { getCart, isReady } = useEcommerce(provider, address);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address && isReady) {
      loadCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [isConnected, address, isReady]);

  // Recargar conteo cuando cambia el carrito (polling cada 3 segundos)
  useEffect(() => {
    if (!isConnected || !address || !isReady) return;

    loadCartCount();
    const interval = setInterval(() => {
      loadCartCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, address, isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCartCount = async () => {
    try {
      setLoading(true);
      const cart = await getCart();
      setCartItemCount(cart.length);
    } catch (err) {
      console.error('Error loading cart count:', err);
      setCartItemCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all transform hover:scale-110 flex items-center justify-center gap-2 min-w-[64px] min-h-[64px]"
        aria-label="Ver carrito"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}
      </button>

      <CartPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onCartUpdate={loadCartCount}
      />
    </>
  );
}

