'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useWallet } from '@/hooks/useWallet';
import { useTokens } from '@/hooks/useTokens';
import { getIPFSImageUrl, getNextIPFSGateway } from '@/lib/ipfs';
import { logger } from '@/lib/logger';
import { dispatchCartUpdated } from '@/lib/cartEvents';
import ProductReviews from './ProductReviews';
import PriceConverter from './PriceConverter';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: () => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const { provider, address } = useWallet();
  const { addToCart, loading } = useEcommerce(provider, address);
  const { selectedCurrency } = useTokens(provider, address);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageGatewayIndices, setImageGatewayIndices] = useState<Map<number, number>>(new Map());
  const [imageErrors, setImageErrors] = useState<Map<number, boolean>>(new Map());

  // Preparar todas las imágenes (principal + adicionales)
  const allImages = [
    product.ipfsImageHash,
    ...(product.ipfsAdditionalImages || []),
  ].filter(Boolean) as string[];

  // Resetear cuando cambia el producto
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
      setQuantity(1);
      setImageGatewayIndices(new Map());
      setImageErrors(new Map());
    }
  }, [isOpen, product.productId]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleImageError = (imageIndex: number) => (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const hash = allImages[imageIndex]?.trim();

    if (!hash) {
      img.src = '/placeholder-product.png';
      return;
    }

    const currentGatewayIndex = imageGatewayIndices.get(imageIndex) || 0;
    const nextGatewayIndex = getNextIPFSGateway(currentGatewayIndex);

    if (nextGatewayIndex === 0) {
      // Ya intentamos todos los gateways
      logger.error(`Todos los gateways IPFS fallaron para imagen ${imageIndex}:`, hash);
      setImageErrors(prev => new Map(prev).set(imageIndex, true));
      img.src = '/placeholder-product.png';
      return;
    }

    // Intentar con el siguiente gateway
    logger.debug(`Gateway ${currentGatewayIndex} falló para imagen ${imageIndex}, intentando con gateway ${nextGatewayIndex}`);
    setImageGatewayIndices(prev => new Map(prev).set(imageIndex, nextGatewayIndex));
    img.src = getIPFSImageUrl(hash, nextGatewayIndex);
  };

  const getImageUrl = (imageIndex: number): string => {
    const hash = allImages[imageIndex]?.trim();
    if (!hash || imageErrors.get(imageIndex)) {
      return '/placeholder-product.png';
    }
    const gatewayIndex = imageGatewayIndices.get(imageIndex) || 0;
    return getIPFSImageUrl(hash, gatewayIndex);
  };

  const handleAddToCart = async () => {
    if (!address) {
      alert('Por favor conecta tu wallet primero');
      return;
    }

    if (product.stock < BigInt(quantity)) {
      alert('Stock insuficiente');
      return;
    }

    setAdding(true);
    try {
      const txHash = await addToCart(product.productId, BigInt(quantity));
      logger.debug('Producto agregado al carrito, transacción:', txHash);
      
      // Esperar un momento para que la transacción se procese
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onAddToCart) {
        onAddToCart();
      }
      // Disparar evento global para actualizar el contador del carrito
      dispatchCartUpdated();
      alert(`Se agregaron ${quantity} unidades al carrito`);
      onClose();
    } catch (err: unknown) {
      logger.error('Error al agregar al carrito:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar al carrito';
      alert(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen) return null;

  const price = formatTokenAmount(product.price, 6);
  const hasStock = product.stock > 0n;
  const selectedImage = allImages[selectedImageIndex];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Galería de Imágenes */}
            <div className="space-y-4">
              {/* Imagen Principal */}
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                <img
                  key={`${product.productId}-${selectedImageIndex}-${imageGatewayIndices.get(selectedImageIndex) || 0}`}
                  src={getImageUrl(selectedImageIndex)}
                  alt={`${product.name} - Imagen ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError(selectedImageIndex)}
                />

                {/* Navegación de imágenes (solo si hay más de una) */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Imagen anterior"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Imagen siguiente"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Indicador de imagen */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === selectedImageIndex
                              ? 'bg-white w-8'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                          aria-label={`Ver imagen ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Contador de imágenes */}
                {allImages.length > 1 && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Miniaturas (si hay más de una imagen) */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {allImages.map((hash, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedImageIndex
                          ? 'border-indigo-600 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(index)}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError(index)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detalles del Producto */}
            <div className="space-y-6">
              {/* Precio y Stock */}
              <div>
                <PriceConverter
                  amount={product.price}
                  fromCurrency={selectedCurrency}
                  showEquivalent={true}
                  decimals={6}
                />
                <div className="flex items-center gap-3">
                  {hasStock ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      ✓ Disponible
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full">
                      ✗ Agotado
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    Stock: <span className="font-semibold">{product.stock.toString()} unidades</span>
                  </span>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Información adicional */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ID del Producto:</span>
                    <span className="font-mono text-gray-900">#{product.productId.toString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ventas Totales:</span>
                    <span className="font-semibold text-gray-900">{product.totalSales.toString()}</span>
                  </div>
                </div>
              </div>

              {/* Controles de compra */}
              {hasStock && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  {/* Selector de cantidad */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock.toString()}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          const max = Number(product.stock);
                          setQuantity(Math.min(Math.max(1, val), max));
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(Number(product.stock), quantity + 1))}
                        className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity >= Number(product.stock)}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      Total: <span className="font-semibold text-gray-900">
                        <PriceConverter
                          amount={product.price * BigInt(quantity)}
                          fromCurrency={selectedCurrency}
                          showEquivalent={false}
                          decimals={6}
                        />
                      </span>
                    </span>
                  </div>

                  {/* Botón agregar al carrito */}
                  <button
                    onClick={handleAddToCart}
                    disabled={adding || loading || !address}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {adding ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Agregando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Agregar al Carrito</span>
                      </>
                    )}
                  </button>

                  {!address && (
                    <p className="text-xs text-center text-gray-500">
                      Conecta tu wallet para agregar productos al carrito
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <ProductReviews product={product} onReviewAdded={() => {}} />
        </div>
      </div>
    </div>
  );
}

