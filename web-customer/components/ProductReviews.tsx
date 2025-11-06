'use client';

import { useState, useEffect } from 'react';
import { Review, Product } from '@/lib/contracts';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useWallet } from '@/hooks/useWallet';
import { logger } from '@/lib/logger';

interface ProductReviewsProps {
  product: Product;
  onReviewAdded?: () => void;
}

export default function ProductReviews({ product, onReviewAdded }: ProductReviewsProps) {
  const { provider, address, isConnected } = useWallet();
  const { getProductReviews, addReview, getProductAverageRating, loading, isReady } = useEcommerce(provider, address);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<{ averageRating: bigint; reviewCount: bigint } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady) {
      loadReviews();
      loadAverageRating();
    } else {
      setLoadingReviews(false);
    }
  }, [product.productId, isReady]);

  const loadReviews = async () => {
    if (!isReady) {
      setLoadingReviews(false);
      return;
    }

    try {
      setLoadingReviews(true);
      const productReviews = await getProductReviews(product.productId);
      // Ordenar por timestamp descendente (más recientes primero)
      productReviews.sort((a, b) => {
        if (b.timestamp > a.timestamp) return 1;
        if (b.timestamp < a.timestamp) return -1;
        return 0;
      });
      setReviews(productReviews);
    } catch (err: unknown) {
      logger.error('Error loading reviews:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar reviews';
      setError(errorMessage);
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadAverageRating = async () => {
    if (!isReady) return;

    try {
      const avg = await getProductAverageRating(product.productId);
      setAverageRating(avg);
    } catch (err) {
      console.error('Error loading average rating:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      alert('Por favor conecta tu wallet primero');
      return;
    }

    if (!comment.trim()) {
      alert('Por favor escribe un comentario');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addReview(product.productId, BigInt(rating), comment.trim());
      setComment('');
      setRating(5);
      setShowForm(false);
      // Recargar reviews y rating
      await Promise.all([loadReviews(), loadAverageRating()]);
      if (onReviewAdded) {
        onReviewAdded();
      }
      alert('¡Review agregado exitosamente!');
    } catch (err: unknown) {
      logger.error('Error submitting review:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar review';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (ratingValue: bigint, interactive = false, onChange?: (rating: number) => void) => {
    const stars = [];
    const ratingNum = Number(ratingValue);
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => interactive && onChange && onChange(i)}
          disabled={!interactive}
          className={`${
            interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
          }`}
        >
          <svg
            className={`w-5 h-5 ${
              i <= ratingNum
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 fill-current'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    return stars;
  };

  const avgRating = averageRating ? Number(averageRating.averageRating) / 100 : 0;
  const reviewCount = averageRating ? Number(averageRating.reviewCount) : 0;

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Reviews</h3>
          {averageRating && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {renderStars(BigInt(Math.round(avgRating)))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        {isConnected && address && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            {showForm ? 'Cancelar' : 'Escribir Review'}
          </button>
        )}
      </div>

      {showForm && isConnected && address && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación
            </label>
            <div className="flex items-center gap-2">
              {renderStars(BigInt(rating), true, (r) => setRating(r))}
              <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Escribe tu opinión sobre este producto..."
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enviando...</span>
              </>
            ) : (
              'Enviar Review'
            )}
          </button>
        </form>
      )}

      {!isConnected && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          Conecta tu wallet para poder escribir un review
        </div>
      )}

      {loadingReviews ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay reviews aún. Sé el primero en escribir uno!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.reviewId.toString()} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold">
                      {review.customerAddress.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {review.customerAddress.slice(0, 6)}...{review.customerAddress.slice(-4)}
                      </span>
                      {review.isVerified && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(review.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

