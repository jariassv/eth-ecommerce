'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import { getIPFSImageUrl, getNextIPFSGateway } from '@/hooks/useIPFS';
import { logger } from '@/lib/logger';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
}

export default function ProductCard({ product, onEdit, onToggleActive }: ProductCardProps) {
  const { address, provider } = useWallet();
  const { setProductActive, loading } = useEcommerce(provider, address);
  const [toggling, setToggling] = useState(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const handleToggleActive = async () => {
    if (!confirm(`¿${product.isActive ? 'Desactivar' : 'Activar'} este producto?`)) {
      return;
    }

    setToggling(true);
    try {
      await setProductActive(product.productId, !product.isActive);
      onToggleActive();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado del producto';
      alert(errorMessage);
    } finally {
      setToggling(false);
    }
  };

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
      logger.error('Todos los gateways IPFS fallaron para:', hash);
      setImageError(true);
      img.src = '/placeholder-product.png';
      return;
    }

    // Intentar con el siguiente gateway
    logger.debug(`Gateway ${currentGatewayIndex} falló, intentando con gateway ${nextGatewayIndex}`);
    setCurrentGatewayIndex(nextGatewayIndex);
    img.src = getIPFSImageUrl(hash, nextGatewayIndex);
  };

  const imageUrl = product.ipfsImageHash && product.ipfsImageHash.trim() && !imageError
    ? getIPFSImageUrl(product.ipfsImageHash, currentGatewayIndex)
    : '/placeholder-product.png';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
        <img
          key={`${product.productId}-${currentGatewayIndex}`}
          src={imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={handleImageError}
          onLoad={() => {
            if (product.ipfsImageHash && currentGatewayIndex > 0) {
              logger.debug(`Imagen IPFS cargada correctamente con gateway ${currentGatewayIndex}:`, product.ipfsImageHash);
            }
            setImageError(false);
          }}
        />
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{product.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ml-2 ${
            product.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {product.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xl font-bold text-indigo-600">
              ${formatTokenAmount(product.price, 6)}
            </p>
            <p className="text-xs text-gray-500">Stock: {product.stock.toString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleToggleActive}
            disabled={toggling || loading}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              product.isActive
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                : 'bg-green-200 hover:bg-green-300 text-green-800'
            } disabled:opacity-50`}
          >
            {toggling ? '...' : product.isActive ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  );
}

