'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Review, Product } from '@/lib/contracts';

interface ReviewsTabProps {
  companyId: bigint;
}

interface ProductWithReviews extends Product {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export default function ReviewsTab({ companyId }: ReviewsTabProps) {
  const { address, provider, isConnected } = useWallet();
  const { 
    getCompanyProducts, 
    getProductReviews, 
    getProductAverageRating,
    loading, 
    isReady 
  } = useEcommerce(provider, address);
  
  const [productsWithReviews, setProductsWithReviews] = useState<ProductWithReviews[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<bigint | null>(null);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (isReady) {
      loadReviews();
    }
  }, [companyId, isReady]);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      setError(null);

      // Obtener productos de la empresa
      const products = await getCompanyProducts(companyId);

      // Para cada producto, obtener sus reviews y estadísticas
      const productsWithReviewsData = await Promise.all(
        products.map(async (product) => {
          try {
            const [reviews, ratingData] = await Promise.all([
              getProductReviews(product.productId),
              getProductAverageRating(product.productId),
            ]);

            // Calcular rating promedio (rating está multiplicado por 100 en el contrato)
            const averageRating = ratingData.reviewCount > 0n
              ? Number(ratingData.averageRating) / 100
              : 0;

            return {
              ...product,
              reviews,
              averageRating,
              reviewCount: Number(ratingData.reviewCount),
            };
          } catch (err) {
            console.error(`Error cargando reviews para producto ${product.productId}:`, err);
            return {
              ...product,
              reviews: [],
              averageRating: 0,
              reviewCount: 0,
            };
          }
        })
      );

      setProductsWithReviews(productsWithReviewsData);
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Error al cargar reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  // Filtrar reviews según los filtros seleccionados
  const filteredReviews = useMemo(() => {
    let allReviews: (Review & { productName: string; productId: bigint })[] = [];

    // Recopilar todas las reviews con información del producto
    productsWithReviews.forEach((product) => {
      product.reviews.forEach((review) => {
        allReviews.push({
          ...review,
          productName: product.name,
          productId: product.productId,
        });
      });
    });

    // Aplicar filtros
    if (selectedProduct) {
      allReviews = allReviews.filter((r) => r.productId === selectedProduct);
    }

    if (filterRating !== null) {
      allReviews = allReviews.filter((r) => Number(r.rating) === filterRating);
    }

    if (filterVerified !== null) {
      allReviews = allReviews.filter((r) => r.isVerified === filterVerified);
    }

    // Ordenar por fecha (más recientes primero)
    return allReviews.sort((a, b) => {
      return Number(b.timestamp) - Number(a.timestamp);
    });
  }, [productsWithReviews, selectedProduct, filterRating, filterVerified]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const allReviews = productsWithReviews.flatMap((p) => p.reviews);
    const totalReviews = allReviews.length;
    const verifiedReviews = allReviews.filter((r) => r.isVerified).length;
    
    const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 estrellas
    let totalRating = 0;

    allReviews.forEach((review) => {
      const rating = Number(review.rating);
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating - 1]++;
        totalRating += rating;
      }
    });

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    return {
      totalReviews,
      verifiedReviews,
      averageRating,
      ratingCounts,
      productsWithReviews: productsWithReviews.filter((p) => p.reviewCount > 0).length,
    };
  }, [productsWithReviews]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: bigint) => {
    const numRating = Number(rating);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= numRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loadingReviews || loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Cargando reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">Error al cargar reviews</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Total Reviews</h4>
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Rating Promedio</h4>
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Verificados</h4>
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.verifiedReviews}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Productos con Reviews</h4>
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.productsWithReviews}</p>
        </div>
      </div>

      {/* Distribución de ratings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Ratings</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingCounts[rating - 1];
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-16 text-right">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto
            </label>
            <select
              value={selectedProduct?.toString() || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? BigInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos los productos</option>
              {productsWithReviews.map((product) => (
                <option key={product.productId.toString()} value={product.productId.toString()}>
                  {product.name} ({product.reviewCount} reviews)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <select
              value={filterRating?.toString() || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos los ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating.toString()}>
                  {rating} estrellas
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verificación
            </label>
            <select
              value={filterVerified === null ? '' : filterVerified.toString()}
              onChange={(e) => setFilterVerified(e.target.value === '' ? null : e.target.value === 'true')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="true">Solo verificados</option>
              <option value="false">Solo no verificados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de reviews */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Reviews ({filteredReviews.length})
        </h3>

        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-gray-600">No hay reviews que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review.reviewId.toString()}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{review.productName}</h4>
                      {review.isVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verificado
                        </span>
                      )}
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(review.timestamp)}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {review.customerAddress.slice(0, 6)}...{review.customerAddress.slice(-4)}
                    </p>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 mt-3">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

