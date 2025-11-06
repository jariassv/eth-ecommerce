'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useIPFS } from '@/hooks/useIPFS';
import { Product } from '@/lib/contracts';
import { parseTokenAmount } from '@/lib/ethers';
import ProductForm from './ProductForm';
import ProductCard from './ProductCard';

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
      loadProducts();
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

