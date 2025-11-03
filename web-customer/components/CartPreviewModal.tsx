'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { CartItem, Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { getIPFSImageUrl } from '@/lib/ipfs';
import Link from 'next/link';

interface CartPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate?: () => void;
}

export default function CartPreviewModal({ isOpen, onClose, onCartUpdate }: CartPreviewModalProps) {
  const { provider, address, isConnected } = useWallet();
  const { getCart, getProduct, getCartTotal, clearCart, createInvoice, getCompany, isReady } = useEcommerce(provider, address);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [total, setTotal] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isConnected && address && isReady) {
      loadCart();
    }
  }, [isOpen, isConnected, address, isReady]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cart = await getCart();
      setCartItems(cart);

      // Cargar detalles de productos
      const productsMap = new Map<string, Product>();
      for (const item of cart) {
        try {
          const product = await getProduct(item.productId);
          productsMap.set(item.productId.toString(), product);
        } catch (err) {
          console.error(`Error loading product ${item.productId}:`, err);
        }
      }
      setProducts(productsMap);

      // Calcular total
      const cartTotal = await getCartTotal();
      setTotal(cartTotal);
    } catch (err: any) {
      console.error('Error loading cart:', err);
      setError(err.message || 'Error al cargar carrito');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!address || cartItems.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      // Obtener companyId del primer producto
      const firstProduct = products.get(cartItems[0].productId.toString());
      if (!firstProduct) {
        throw new Error('No se pudo obtener información del producto');
      }

      const companyId = firstProduct.companyId;
      const company = await getCompany(companyId);
      const merchantAddress = company.companyAddress;

      // Crear invoice
      const { invoiceId, totalAmount } = await createInvoice(companyId);

      // Limpiar carrito
      await clearCart();

      // Notificar actualización
      if (onCartUpdate) {
        onCartUpdate();
      }

      // Disparar evento global para actualizar el contador del carrito
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Cerrar modal
      onClose();

      // Redirigir a pasarela de pago
      const paymentGatewayUrl = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL || 'http://localhost:6002';
      const amount = formatTokenAmount(totalAmount, 6);
      
      const redirectUrl = `${paymentGatewayUrl}/?merchant_address=${merchantAddress}&amount=${amount}&invoice=${invoiceId}&redirect=${encodeURIComponent(window.location.origin + '/orders')}`;
      
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error('Error in checkout:', err);
      setError(err.message || 'Error al procesar checkout');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Carrito de Compras</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Cargando carrito...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 mb-4">Tu carrito está vacío</p>
              <Link
                href="/"
                onClick={onClose}
                className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Ir a Comprar
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const product = products.get(item.productId.toString());
                if (!product) return null;

                const itemTotal = product.price * item.quantity;
                const imageUrl = product.ipfsImageHash
                  ? getIPFSImageUrl(product.ipfsImageHash)
                  : '/placeholder-product.png';

                return (
                  <div key={item.productId.toString()} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-600">Cantidad: {item.quantity.toString()}</p>
                      <p className="text-lg font-bold text-indigo-600 mt-1">
                        ${formatTokenAmount(itemTotal, 6)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ${formatTokenAmount(total, 6)}
              </span>
            </div>
            <div className="flex gap-3">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Ver Detalle
              </Link>
              <button
                onClick={handleCheckout}
                disabled={processing || !isConnected || !address}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Completar Compra</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

