'use client';

import { Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useWallet } from '@/hooks/useWallet';
import { useTokens } from '@/hooks/useTokens';
import { getIPFSImageUrl, getNextIPFSGateway } from '@/lib/ipfs';
import PriceConverter from './PriceConverter';
import { useState } from 'react';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { provider, address } = useWallet();
  const { addToCart, loading } = useEcommerce(provider, address);
  const { selectedCurrency } = useTokens(provider, address);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const price = formatTokenAmount(product.price, 6);
  const hasStock = product.stock > 0n;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const hash = product.ipfsImageHash?.trim();
    
    if (!hash) {
      img.src = '/placeholder-product.png';
      return;
    }

    // Intentar con el siguiente gateway
    const nextGatewayIndex = getNextIPFSGateway(currentGatewayIndex);
    
    if (nextGatewayIndex === 0) {
      // Ya intentamos todos los gateways, usar placeholder
      console.error('Todos los gateways IPFS fallaron para:', hash);
      setImageError(true);
      img.src = '/placeholder-product.png';
      return;
    }

    // Intentar con el siguiente gateway
    console.log(`Gateway ${currentGatewayIndex} falló, intentando con gateway ${nextGatewayIndex}`);
    setCurrentGatewayIndex(nextGatewayIndex);
    img.src = getIPFSImageUrl(hash, nextGatewayIndex);
  };

  const imageUrl = product.ipfsImageHash && product.ipfsImageHash.trim() && !imageError
    ? getIPFSImageUrl(product.ipfsImageHash, currentGatewayIndex)
    : '/placeholder-product.png';

  const handleAddToCart = async () => {
    if (!address) {
      alert('Por favor conecta tu wallet primero');
      return;
    }

    if (!hasStock) {
      alert('Producto sin stock');
      return;
    }

    setAdding(true);
    try {
      const tx = await addToCart(product.productId, BigInt(quantity));
      console.log('Producto agregado al carrito, transacción:', tx);
      
      // Esperar un momento para que la transacción se procese
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onAddToCart) {
        onAddToCart();
      }
      // Disparar evento global para actualizar el contador del carrito
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      alert(`Se agregaron ${quantity} unidades al carrito`);
    } catch (err: any) {
      console.error('Error al agregar al carrito:', err);
      alert(err.message || 'Error al agregar al carrito');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 flex flex-col cursor-pointer" onClick={() => setShowDetailModal(true)}>
        {/* Imagen con overlay en hover */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            key={`${product.productId}-${currentGatewayIndex}`}
            src={imageUrl}
            alt={product.name}
            className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
            onError={handleImageError}
            onLoad={() => {
              if (product.ipfsImageHash && currentGatewayIndex > 0) {
                console.log(`Imagen IPFS cargada correctamente con gateway ${currentGatewayIndex}:`, product.ipfsImageHash);
              }
              setImageError(false);
            }}
          />
        {/* Badge de stock */}
        <div className="absolute top-3 right-3">
          {hasStock ? (
            <span className="px-3 py-1 bg-green-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
              Disponible
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm">
              Agotado
            </span>
          )}
        </div>
        {/* Overlay en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowDetailModal(true); }}>
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="mt-auto space-y-4">
          {/* Precio y stock */}
          <div className="flex items-baseline justify-between border-t border-gray-100 pt-3">
            <div>
              <PriceConverter
                amount={product.price}
                fromCurrency={selectedCurrency}
                showEquivalent={true}
                decimals={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Stock: <span className="font-semibold">{product.stock.toString()} unidades</span>
              </p>
            </div>
          </div>

          {hasStock ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(Number(product.stock), quantity + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= Number(product.stock)}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                disabled={adding || loading || !address}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  Conecta tu wallet para comprar
                </p>
              )}
            </div>
          ) : (
            <div className="w-full bg-gray-100 text-gray-500 font-medium py-3 px-4 rounded-lg text-center border border-gray-200">
              Sin Stock Disponible
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal de detalle del producto */}
    <ProductDetailModal
      product={product}
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      onAddToCart={onAddToCart}
    />
    </>
  );
}

