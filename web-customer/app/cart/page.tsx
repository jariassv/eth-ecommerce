'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { CartItem, Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import Header from '@/components/Header';
import Link from 'next/link';

export default function CartPage() {
  const { provider, address } = useWallet();
  const { contract, getCart, getProduct, getCartTotal, clearCart, createInvoice, getCompany, loading } = useEcommerce(provider, address);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [total, setTotal] = useState<bigint>(0n);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadCart();
    }
  }, [address]);

  const loadCart = async () => {
    try {
      const cart = await getCart();
      setCartItems(cart);

      // Cargar detalles de productos
      const productsMap = new Map<string, Product>();
      for (const item of cart) {
        const product = await getProduct(item.productId);
        productsMap.set(item.productId.toString(), product);
      }
      setProducts(productsMap);

      // Calcular total
      const cartTotal = await getCartTotal();
      setTotal(cartTotal);
    } catch (err: any) {
      setError(err.message || 'Error al cargar carrito');
    }
  };

  const handleCheckout = async () => {
    if (!address || cartItems.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      // Obtener companyId del primer producto (asumiendo todos son de la misma empresa)
      const firstProduct = products.get(cartItems[0].productId.toString());
      if (!firstProduct) {
        throw new Error('No se pudo obtener información del producto');
      }

      const companyId = firstProduct.companyId;

      // Obtener información de la empresa para obtener su dirección
      const company = await getCompany(companyId);
      const merchantAddress = company.companyAddress;

      // Crear invoice
      const { invoiceId, totalAmount } = await createInvoice(companyId);

      // Limpiar carrito
      await clearCart();

      // Redirigir a pasarela de pago
      const paymentGatewayUrl = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL || 'http://localhost:6002';
      const amount = formatTokenAmount(totalAmount, 6);
      
      const redirectUrl = `${paymentGatewayUrl}/?merchant_address=${merchantAddress}&amount=${amount}&invoice=${invoiceId}&redirect=${encodeURIComponent(window.location.origin + '/orders')}`;
      
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.message || 'Error al procesar checkout');
      setProcessing(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Carrito de Compras
            </h2>
            <p className="text-gray-600 mb-6">
              Por favor conecta tu wallet para ver tu carrito
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalFormatted = formatTokenAmount(total, 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Carrito de Compras
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading && cartItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Cargando carrito...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">
              Tu carrito está vacío
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  const product = products.get(item.productId.toString());
                  if (!product) return null;

                  const itemTotal = product.price * item.quantity;
                  const itemTotalFormatted = formatTokenAmount(itemTotal, 6);

                  return (
                    <div key={item.productId.toString()} className="p-6 flex items-center gap-6">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.description.substring(0, 100)}...
                        </p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">
                            Precio unitario: ${formatTokenAmount(product.price, 6)} USDT
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity.toString()}
                        </p>
                        <p className="text-lg font-bold text-indigo-600 mt-1">
                          ${itemTotalFormatted} USDT
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ${totalFormatted} USDT
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={processing || loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Procesando...' : 'Proceder al Pago'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

