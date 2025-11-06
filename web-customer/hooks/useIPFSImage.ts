/**
 * Hook para manejar imágenes IPFS con fallback de gateways
 * Proporciona lógica reutilizable para cargar imágenes IPFS con múltiples gateways
 */

import { useState, useCallback } from 'react';
import { getIPFSImageUrl, getNextIPFSGateway } from '@/lib/ipfs';
import { logger } from '@/lib/logger';

interface UseIPFSImageReturn {
  imageUrl: string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  reset: () => void;
  key: string; // Para forzar re-render cuando cambia el gateway
}

/**
 * Hook para manejar la carga de imágenes IPFS con fallback automático de gateways
 * 
 * @param hash - Hash IPFS de la imagen (puede ser undefined)
 * @returns Objeto con URL de imagen, handler de errores, función reset y key para re-render
 */
export function useIPFSImage(hash: string | undefined): UseIPFSImageReturn {
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const cleanHash = hash?.trim();
    
    if (!cleanHash) {
      img.src = '/placeholder-product.png';
      return;
    }
    
    const nextGatewayIndex = getNextIPFSGateway(currentGatewayIndex);
    if (nextGatewayIndex === 0) {
      // Ya intentamos todos los gateways, usar placeholder
      logger.error('Todos los gateways IPFS fallaron para:', cleanHash);
      setImageError(true);
      img.src = '/placeholder-product.png';
      return;
    }
    
    // Intentar con el siguiente gateway
    logger.debug(`Gateway ${currentGatewayIndex} falló, intentando con gateway ${nextGatewayIndex}`);
    setCurrentGatewayIndex(nextGatewayIndex);
    img.src = getIPFSImageUrl(cleanHash, nextGatewayIndex);
  }, [hash, currentGatewayIndex]);

  const reset = useCallback(() => {
    setCurrentGatewayIndex(0);
    setImageError(false);
  }, []);

  const imageUrl = hash && hash.trim() && !imageError
    ? getIPFSImageUrl(hash, currentGatewayIndex)
    : '/placeholder-product.png';

  return {
    imageUrl,
    handleImageError,
    reset,
    key: `${hash}-${currentGatewayIndex}`, // Para forzar re-render cuando cambia el gateway
  };
}

