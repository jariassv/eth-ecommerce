'use client';

import { Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useWallet } from '@/hooks/useWallet';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { provider, address } = useWallet();
  const { addToCart, loading } = useEcommerce(provider, address);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState(false);

  const price = formatTokenAmount(product.price, 6);
  const hasStock = product.stock > 0n;

  // IPFS Gateway URL (usando Cloudflare IPFS)
  const imageUrl = product.ipfsImageHash
    ? `https://cloudflare-ipfs.com/ipfs/${product.ipfsImageHash}`
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
      await addToCart(product.productId, BigInt(quantity));
      if (onAddToCart) {
        onAddToCart();
      }
      alert(`Se agregaron ${quantity} unidades al carrito`);
    } catch (err: any) {
      alert(err.message || 'Error al agregar al carrito');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.png';
          }}
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              ${price} USDT
            </p>
            <p className="text-xs text-gray-500">
              Stock: {product.stock.toString()}
            </p>
          </div>
        </div>

        {hasStock ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Cantidad:</label>
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
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={adding || loading || !address}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Agregando...' : 'Agregar al Carrito'}
            </button>
          </div>
        ) : (
          <div className="w-full bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-lg text-center">
            Sin Stock
          </div>
        )}
      </div>
    </div>
  );
}

