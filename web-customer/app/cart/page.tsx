'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useTokens, SupportedCurrency } from '@/hooks/useTokens';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { CartItem, Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { getIPFSImageUrl } from '@/lib/ipfs';
import { convertUSDTtoEURT } from '@/lib/exchangeRate';
import { dispatchCartUpdated } from '@/lib/cartEvents';
import { logger } from '@/lib/logger';
import { CONTRACTS } from '@/lib/constants';
import BuyTokensButton from '@/components/BuyTokensButton';
import Header from '@/components/Header';
import CurrencySelector from '@/components/CurrencySelector';
import PriceConverter from '@/components/PriceConverter';
import Link from 'next/link';

// Componente para cada item del carrito
function CartItemRow({ 
  item, 
  product, 
  onRemove, 
  selectedCurrency 
}: { 
  item: CartItem; 
  product: Product; 
  onRemove: () => Promise<void>;
  selectedCurrency: 'USDT' | 'EURT';
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`¿Deseas remover ${product.name} del carrito?`)) return;

    setRemoving(true);
    try {
      await onRemove();
    } catch (err: unknown) {
      logger.error('Error al remover del carrito:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al remover del carrito';
      alert(errorMessage);
    } finally {
      setRemoving(false);
    }
  };

  const itemTotal = product.price * item.quantity;
  const imageUrl = product.ipfsImageHash
    ? getIPFSImageUrl(product.ipfsImageHash)
    : '/placeholder-product.png';

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
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
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Precio unitario: <PriceConverter
                amount={product.price}
                fromCurrency={selectedCurrency}
                showEquivalent={false}
                decimals={6}
              />
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              Cantidad: <span className="font-semibold">{item.quantity.toString()}</span>
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <PriceConverter
            amount={itemTotal}
            fromCurrency={selectedCurrency}
            showEquivalent={false}
            decimals={6}
          />
        </div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
          aria-label="Quitar del carrito"
        >
          {removing ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

const USD_TOKEN_ADDRESS = CONTRACTS.USD_TOKEN;
const EUR_TOKEN_ADDRESS = CONTRACTS.EUR_TOKEN;

export default function CartPage() {
  const { provider, address, isConnected } = useWallet();
  const { contract, getCart, getProduct, getCartTotal, clearCart, createInvoiceWithCurrency, getCompany, removeFromCart, updateCartItem, loading, isReady } = useEcommerce(provider, address);
  const { selectedCurrency, setSelectedCurrency, loadTokens, approveToken, getSelectedToken } = useTokens(provider, address);
  const { rate, rateInfo, loading: loadingRate, error: rateError } = useExchangeRate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [total, setTotal] = useState<bigint>(BigInt(0)); // Total en USDT (base)
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (address && isReady) {
      loadCart();
    }
  }, [address, isReady]);

  // Recargar tokens cuando cambie la moneda seleccionada o el rate
  useEffect(() => {
    if (address && isReady && total > BigInt(0)) {
      // Calcular requiredAmount según la moneda seleccionada
      if (selectedCurrency === 'EURT' && rate) {
        // Si es EURT y hay rate, convertir el total a EURT
        const requiredAmountEURT = convertUSDTtoEURT(total, rate);
        // Pero loadTokens espera el amount en USDT y el rate, y calcula internamente
        loadTokens(total, rate ?? undefined);
      } else {
        // Para USDT, pasar el total directamente
        loadTokens(total, rate ?? undefined);
      }
    }
  }, [selectedCurrency, rate, total, address, isReady, loadTokens]);

  const loadCart = async () => {
    if (!isReady || !address) {
      setLoadingCart(false);
      return;
    }

    try {
      setLoadingCart(true);
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
          logger.error(`Error loading product ${item.productId}:`, err);
        }
      }
      setProducts(productsMap);

      // Calcular total
      const cartTotal = await getCartTotal();
      setTotal(cartTotal);
      
      // Recargar tokens con el total requerido (no recargar aquí, se recargará cuando cambie la moneda)
    } catch (err: unknown) {
      logger.error('Error loading cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar carrito';
      setError(errorMessage);
    } finally {
      setLoadingCart(false);
    }
  };

  const handleCheckout = async () => {
    if (!address || cartItems.length === 0) return;

    // Validar rate
    if (!rateInfo || !rateInfo.isValid || !rateInfo.isFresh) {
      setError('El rate de conversión no está disponible o está desactualizado. Por favor, intenta más tarde.');
      return;
    }

    // Recalcular requiredAmount
    let requiredAmount = total; // Por defecto USDT
    if (selectedCurrency === 'EURT' && rate) {
      requiredAmount = convertUSDTtoEURT(total, rate);
    }
    
    // Obtener token seleccionado (los tokens ya están cargados por el useEffect)
    const selectedToken = getSelectedToken();
    if (!selectedToken) {
      setError('No se pudo obtener información del token seleccionado');
      return;
    }

    // Validar balance - comparar directamente los bigints
    if (selectedToken.balance < requiredAmount) {
      setError(`Saldo insuficiente. Necesitas ${formatTokenAmount(requiredAmount, selectedToken.decimals)} ${selectedCurrency} pero tienes ${selectedToken.balanceFormatted} ${selectedCurrency}`);
      return;
    }

    // Validar y aprobar si es necesario - verificar con precisión para evitar aprobaciones innecesarias
    // Solo aprobar si la allowance es realmente menor que el monto requerido
    const needsApproval = selectedToken.allowance < requiredAmount;
    if (needsApproval) {
      setApproving(true);
      setError(null);
      try {
        await approveToken(selectedCurrency, requiredAmount, total, rate ?? undefined);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error al aprobar token';
        setError(errorMessage);
        setApproving(false);
        return;
      }
      setApproving(false);
    }

    setProcessing(true);
    setError(null);

    try {
      // Obtener companyId del primer producto (asumiendo todos son de la misma empresa)
      const firstProduct = products.get(cartItems[0].productId.toString());
      if (!firstProduct) {
        throw new Error('No se pudo obtener información del producto');
      }

      const companyId = firstProduct.companyId;

      // Obtener información de la empresa para obtener su dirección (merchant address)
      const company = await getCompany(companyId);
      const merchantAddress = company.companyAddress;

      // Obtener dirección del token de pago
      const paymentTokenAddress = selectedCurrency === 'USDT' ? USD_TOKEN_ADDRESS : EUR_TOKEN_ADDRESS;
      if (!paymentTokenAddress) {
        throw new Error(`Dirección del token ${selectedCurrency} no configurada`);
      }

      // Crear invoice con currency
      // IMPORTANTE: Pasamos el total en USDT (base) como expectedTotalUSDT
      // El contrato calculará el total en la moneda seleccionada usando el oráculo
      const { invoiceId, totalAmount } = await createInvoiceWithCurrency(
        companyId,
        paymentTokenAddress,
        total // expectedTotalUSDT - total del carrito en USDT
      );

      // Limpiar carrito
      await clearCart();

      // Redirigir a pasarela de pago
      // IMPORTANTE: merchant_address es la dirección de la empresa, NO la del token
      const paymentGatewayUrl = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL || 'http://localhost:6002';
      const amount = formatTokenAmount(totalAmount, selectedToken.decimals);
      
      const redirectUrl = `${paymentGatewayUrl}/?merchant_address=${merchantAddress}&amount=${amount}&invoice=${invoiceId}&redirect=${encodeURIComponent(window.location.origin + '/orders')}`;
      
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar checkout';
      setError(errorMessage);
      setProcessing(false);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Conecta tu Wallet</h1>
            <p className="text-gray-600 mb-6">
              Necesitas conectar tu wallet para ver tu carrito de compras
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <Header />
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Carrito de Compras
          </h1>
          <p className="text-gray-600">
            Revisa tus productos antes de proceder al pago
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading && cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">Cargando carrito...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-20 w-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Tu carrito está vacío
            </h3>
            <p className="text-gray-600 mb-6">
              Agrega productos a tu carrito para comenzar
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const product = products.get(item.productId.toString());
                  if (!product) return null;

                  return (
                    <CartItemRow
                      key={item.productId.toString()}
                      item={item}
                      product={product}
                      selectedCurrency={selectedCurrency}
                      onRemove={async () => {
                        await removeFromCart(item.productId);
                        await loadCart();
                        dispatchCartUpdated();
                      }}
                    />
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-200 p-6 space-y-6">
                {/* Selección de moneda */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Moneda de Pago</h3>
                  <CurrencySelector
                    selectedCurrency={selectedCurrency}
                    onCurrencyChange={(currency) => {
                      setSelectedCurrency(currency);
                      // Recargar tokens cuando cambie la moneda
                      if (currency === 'EURT' && rate) {
                        loadTokens(total, rate ?? undefined);
                      } else {
                        loadTokens(total, rate ?? undefined);
                      }
                    }}
                    requiredAmount={selectedCurrency === 'EURT' && rate ? convertUSDTtoEURT(total, rate) : total}
                    showBalance={true}
                  />
                </div>

                {/* Advertencias de rate */}
                {rateInfo && (!rateInfo.isValid || !rateInfo.isFresh) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠ Advertencia:</strong> El rate de conversión no está disponible o está desactualizado.
                      {!rateInfo.isValid && ' El rate está fuera del rango válido.'}
                      {!rateInfo.isFresh && ' El rate no se ha actualizado en más de 24 horas.'}
                      Solo se puede pagar con USDT en este momento.
                    </p>
                  </div>
                )}

                {/* Total del pedido */}
                <div className="flex justify-between items-center border-t border-indigo-200 pt-4">
                  <span className="text-xl font-semibold text-gray-900">Total del Pedido:</span>
                  <div className="text-right">
                    <PriceConverter
                      amount={total}
                      fromCurrency={rateInfo && rateInfo.isValid && rateInfo.isFresh ? selectedCurrency : 'USDT'}
                      showEquivalent={true}
                      decimals={6}
                    />
                  </div>
                </div>

                {/* Mensaje de error con botón de compra si es saldo insuficiente */}
                {error && (
                  <div className={`rounded-lg p-4 space-y-3 ${
                    error.includes('Saldo insuficiente') 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className={`text-sm font-semibold ${
                      error.includes('Saldo insuficiente') ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {error}
                    </p>
                    {error.includes('Saldo insuficiente') && (
                      <div className="flex justify-end">
                        <BuyTokensButton 
                          currency={selectedCurrency}
                          onPurchaseComplete={async () => {
                            // Recargar carrito y tokens después de compra
                            await loadCart();
                            if (address && isReady && total > BigInt(0)) {
                              const selectedToken = getSelectedToken();
                              if (selectedToken) {
                                await loadTokens(total, rate ?? undefined);
                              }
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Botón de checkout */}
                <button
                  onClick={handleCheckout}
                  disabled={processing || loading || approving || loadingRate || (rateInfo ? (!rateInfo.isValid || !rateInfo.isFresh) : false)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                >
                  {approving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Aprobando token...</span>
                    </>
                  ) : processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Proceder al Pago</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

