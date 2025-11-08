'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useTokens } from '@/hooks/useTokens';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { CartItem, Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { getIPFSImageUrl } from '@/lib/ipfs';
import { convertUSDTtoEURT } from '@/lib/exchangeRate';
import { logger } from '@/lib/logger';
import { dispatchTokenBalanceUpdated, CART_EVENTS } from '@/lib/cartEvents';
import BuyTokensButton from './BuyTokensButton';
import PriceConverter from './PriceConverter';
import CurrencySelector from './CurrencySelector';
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

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
        <div className="mt-1">
          <PriceConverter
            amount={itemTotal}
            fromCurrency={selectedCurrency}
            showEquivalent={false}
            decimals={6}
          />
        </div>
      </div>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}

interface CartPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate?: () => void;
}

export default function CartPreviewModal({ isOpen, onClose, onCartUpdate }: CartPreviewModalProps) {
  const { provider, address, isConnected } = useWallet();
  const { getCart, getProduct, getCartTotal, clearCart, createInvoiceWithCurrency, getCompany, removeFromCart, isReady } = useEcommerce(provider, address);
  const { selectedCurrency, setSelectedCurrency, loadTokens, approveToken, getSelectedToken } = useTokens(provider, address);
  const { rate, rateInfo, loading: loadingRate, error: rateError } = useExchangeRate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Map<string, Product>>(new Map());
  const [total, setTotal] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isChangingCurrency = useRef(false);
  
  // Calcular si hay saldo insuficiente
  const selectedToken = getSelectedToken();
  const requiredAmountUSDT = total;
  const requiredAmountEURT = rate ? convertUSDTtoEURT(total, rate) : undefined;
  const requiredAmountSelected =
    selectedCurrency === 'EURT'
      ? (requiredAmountEURT ?? requiredAmountUSDT)
      : requiredAmountUSDT;
  const hasInsufficientBalance = selectedToken && total > 0n && selectedToken.balance < requiredAmountSelected;
  const hasZeroBalance = total > 0n && (!selectedToken || selectedToken.balance === 0n);

  const USD_TOKEN_ADDRESS = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
    : '';
  const EUR_TOKEN_ADDRESS = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
    : '';

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
          logger.error(`Error loading product ${item.productId}:`, err);
        }
      }
      setProducts(productsMap);

      // Calcular total
      const cartTotal = await getCartTotal();
      setTotal(cartTotal);
      
      // Cargar tokens con el total requerido
      if (cartTotal > 0n) {
        await loadTokens(cartTotal, rate);
      }
    } catch (err: unknown) {
      logger.error('Error loading cart:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar carrito';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Recargar tokens cuando cambie el rate o el total (pero no cuando cambie selectedCurrency manualmente)
  useEffect(() => {
    if (isOpen && address && isReady && total > 0n) {
      // Recargar tokens cuando cambie el rate o el total
      loadTokens(total, rate);
    }
  }, [rate, total, address, isReady, isOpen, loadTokens]);

  // Escuchar eventos de actualización de balance de tokens
  useEffect(() => {
    const handleTokenBalanceUpdate = () => {
      // Recargar tokens cuando se actualiza el balance
      if (isOpen && address && isReady && total > 0n) {
        loadTokens(total, rate).catch(err => {
          logger.error('Error loading tokens after balance update:', err);
        });
      }
    };

    window.addEventListener(CART_EVENTS.TOKEN_BALANCE_UPDATED, handleTokenBalanceUpdate);

    return () => {
      window.removeEventListener(CART_EVENTS.TOKEN_BALANCE_UPDATED, handleTokenBalanceUpdate);
    };
  }, [isOpen, address, isReady, total, rate, loadTokens]);

  const handleCheckout = async () => {
    if (!address || cartItems.length === 0) return;

    // Validar rate
    if (!rateInfo || !rateInfo.isValid || !rateInfo.isFresh) {
      setError('El rate de conversión no está disponible o está desactualizado. Por favor, intenta más tarde.');
      return;
    }

    // Recalcular requiredAmount y recargar tokens para asegurar validación correcta
    let requiredAmount = requiredAmountUSDT;
    if (selectedCurrency === 'EURT') {
      requiredAmount = requiredAmountEURT ?? requiredAmountUSDT;
    }
    
    // Recargar tokens con el amount correcto antes de validar
    await loadTokens(total, rate);
    
    // Obtener token seleccionado después de recargar
    const selectedToken = getSelectedToken();
    if (!selectedToken) {
      setError('No se pudo obtener información del token seleccionado');
      return;
    }

    // Validar balance
    // No mostrar error, solo prevenir el checkout - el botón de compra ya está visible
    if (selectedToken.balance < requiredAmount) {
      return; // Silenciosamente prevenir el checkout
    }

    // Validar y aprobar si es necesario
    if (selectedToken.needsApproval || selectedToken.allowance < requiredAmount) {
      setApproving(true);
      setError(null);
      try {
        await approveToken(selectedCurrency, requiredAmount, total, rate);
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
      // Obtener companyId del primer producto
      const firstProduct = products.get(cartItems[0].productId.toString());
      if (!firstProduct) {
        throw new Error('No se pudo obtener información del producto');
      }

      const companyId = firstProduct.companyId;
      const company = await getCompany(companyId);
      const merchantAddress = company.companyAddress;

      // Obtener dirección del token de pago
      const paymentTokenAddress = selectedCurrency === 'USDT' ? USD_TOKEN_ADDRESS : EUR_TOKEN_ADDRESS;
      if (!paymentTokenAddress) {
        throw new Error(`Dirección del token ${selectedCurrency} no configurada`);
      }

      // Crear invoice con currency
      const { invoiceId, totalAmount } = await createInvoiceWithCurrency(
        companyId,
        paymentTokenAddress,
        total // expectedTotalUSDT - total del carrito en USDT
      );

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
      const amount = formatTokenAmount(totalAmount, selectedToken.decimals);
      
      const redirectUrl = `${paymentGatewayUrl}/?merchant_address=${merchantAddress}&amount=${amount}&invoice=${invoiceId}&redirect=${encodeURIComponent(window.location.origin + '/orders')}`;
      
      window.location.href = redirectUrl;
    } catch (err: unknown) {
      logger.error('Error in checkout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar checkout';
      setError(errorMessage);
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
          ) : error && !error.includes('Saldo insuficiente') && !error.includes('No tienes') ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold text-center">{error}</p>
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

                return (
                  <CartItemRow
                    key={item.productId.toString()}
                    item={item}
                    product={product}
                    selectedCurrency={selectedCurrency}
                    onRemove={async () => {
                      await removeFromCart(item.productId);
                      await loadCart();
                      if (onCartUpdate) {
                        onCartUpdate();
                      }
                      window.dispatchEvent(new CustomEvent('cartUpdated'));
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
            {/* Selección de moneda */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Moneda de Pago</h3>
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={(currency) => {
                  // Cambiar moneda inmediatamente - el estado se actualiza de forma sincrónica
                  setSelectedCurrency(currency);
                  // Recargar tokens después de un pequeño delay para evitar bloqueos
                  setTimeout(() => {
                    if (total > 0n) {
                      loadTokens(total, rate).catch(err => {
                        logger.error('Error loading tokens after currency change:', err);
                      });
                    }
                  }, 200);
                }}
                requiredAmounts={{
                  USDT: requiredAmountUSDT,
                  EURT: requiredAmountEURT,
                }}
                showBalance={true}
              />
            </div>

            {/* Advertencias de rate */}
            {rateInfo && (!rateInfo.isValid || !rateInfo.isFresh) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>⚠ Advertencia:</strong> El rate de conversión no está disponible o está desactualizado.
                  {!rateInfo.isValid && ' El rate está fuera del rango válido.'}
                  {!rateInfo.isFresh && ' El rate no se ha actualizado en más de 24 horas.'}
                  Solo se puede pagar con USDT en este momento.
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <PriceConverter
                amount={total}
                fromCurrency={rateInfo && rateInfo.isValid && rateInfo.isFresh ? selectedCurrency : 'USDT'}
                showEquivalent={true}
                decimals={6}
              />
            </div>

            {/* Botón de checkout único */}
            <div className="space-y-3">
              {/* Botón de compra solo si hay saldo insuficiente o balance 0 */}
              {(hasInsufficientBalance || hasZeroBalance) && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-indigo-800 flex-1">
                      {hasZeroBalance 
                        ? `No tienes ${selectedCurrency} en tu wallet.`
                        : `Saldo insuficiente de ${selectedCurrency}.`
                      }
                    </p>
                    <BuyTokensButton 
                      currency={selectedCurrency} 
                      onPurchaseComplete={async () => {
                        // Disparar evento de actualización de balance
                        dispatchTokenBalanceUpdated();
                        // Recargar tokens y carrito después de comprar tokens
                        if (address && provider) {
                          await loadTokens(total, rate);
                        }
                        await loadCart();
                        if (onCartUpdate) {
                          onCartUpdate();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
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
                disabled={processing || approving || !isConnected || !address || loadingRate || (rateInfo && (!rateInfo.isValid || !rateInfo.isFresh))}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    <span>Completar Compra</span>
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

