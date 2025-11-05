'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useIPFS, getIPFSImageUrl, getNextIPFSGateway, getAllIPFSGateways } from '@/hooks/useIPFS';
import { Product } from '@/lib/contracts';
import { formatTokenAmount, parseTokenAmount } from '@/lib/ethers';
import ProductForm from './ProductForm';

interface ProductsTabProps {
  companyId: bigint;
}

export default function ProductsTab({ companyId }: ProductsTabProps) {
  const { address, provider } = useWallet();
  const { getCompanyProducts, loading, isReady } = useEcommerce(provider, address);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (isReady) {
      // Solo cargar productos si no están ya cargados o si el companyId cambió
      if (products.length === 0) {
        loadProducts();
      }
    }
  }, [companyId, isReady]);

  const loadProducts = async () => {
    if (!isReady) {
      return;
    }

    try {
      setLoadingProducts(true);
      const companyProducts = await getCompanyProducts(companyId);
      setProducts(companyProducts);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  if (loadingProducts || loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Productos ({products.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all transform hover:scale-105"
        >
          + Agregar Producto
        </button>
      </div>

      {showForm && (
        <ProductForm
          companyId={companyId}
          product={editingProduct || undefined}
          onClose={handleFormClose}
          onSuccess={loadProducts}
        />
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-600 mb-4">No hay productos registrados</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Agregar Primer Producto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.productId.toString()}
              product={product}
              onEdit={() => handleEdit(product)}
              onToggleActive={loadProducts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onToggleActive: () => void;
}

function ProductCard({ product, onEdit, onToggleActive }: ProductCardProps) {
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
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado del producto');
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
              console.log(`Imagen IPFS cargada correctamente con gateway ${currentGatewayIndex}:`, product.ipfsImageHash);
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

