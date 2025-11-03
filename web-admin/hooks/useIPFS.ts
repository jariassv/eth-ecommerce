'use client';

import { useState } from 'react';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Hook para subir imágenes a IPFS usando Pinata
 */
export function useIPFS() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToIPFS = async (file: File): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      // Verificar variables de entorno
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
      
      if (!pinataJWT) {
        throw new Error('PINATA_JWT no configurado. Por favor, configura NEXT_PUBLIC_PINATA_JWT en tu archivo .env.local. Puedes obtener un JWT en https://app.pinata.cloud/');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);

      // Metadata opcional
      const metadata = JSON.stringify({
        name: file.name,
      });
      formData.append('pinataMetadata', metadata);

      // Opciones de Pinata
      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      // Subir a Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.details || `Error al subir a IPFS: ${response.statusText}`);
      }

      const data: PinataResponse = await response.json();
      return data.IpfsHash;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al subir imagen a IPFS';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleToIPFS = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    setError(null);

    try {
      const hashes = await Promise.all(files.map(file => uploadToIPFS(file)));
      return hashes;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al subir imágenes a IPFS';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadToIPFS,
    uploadMultipleToIPFS,
    uploading,
    error,
  };
}

/**
 * Lista de gateways IPFS como fallback
 */
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
  'https://dweb.link/ipfs',
];

/**
 * Función helper para obtener URL de imagen IPFS
 */
export function getIPFSImageUrl(hash: string, gatewayIndex: number = 0): string {
  if (!hash) return '';
  
  // Limpiar el hash (eliminar espacios, saltos de línea, etc.)
  const cleanHash = hash.trim();
  
  // Si el hash ya tiene el prefijo /ipfs/, removerlo
  let hashOnly = cleanHash;
  if (cleanHash.startsWith('/ipfs/')) {
    hashOnly = cleanHash.replace('/ipfs/', '');
  } else if (cleanHash.startsWith('ipfs://')) {
    hashOnly = cleanHash.replace('ipfs://', '');
  }
  
  // Usar el gateway especificado (por defecto el primero)
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}/${hashOnly}`;
}

/**
 * Obtener el siguiente gateway IPFS como fallback
 */
export function getNextIPFSGateway(currentIndex: number): number {
  return (currentIndex + 1) % IPFS_GATEWAYS.length;
}

/**
 * Obtener todos los gateways disponibles para un hash
 */
export function getAllIPFSGateways(hash: string): string[] {
  if (!hash) return [];
  
  const cleanHash = hash.trim();
  let hashOnly = cleanHash;
  if (cleanHash.startsWith('/ipfs/')) {
    hashOnly = cleanHash.replace('/ipfs/', '');
  } else if (cleanHash.startsWith('ipfs://')) {
    hashOnly = cleanHash.replace('ipfs://', '');
  }
  
  return IPFS_GATEWAYS.map(gateway => `${gateway}/${hashOnly}`);
}

