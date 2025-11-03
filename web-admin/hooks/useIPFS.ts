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
        throw new Error('PINATA_JWT no configurado. Por favor, configura las variables de entorno.');
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
 * Función helper para obtener URL de imagen IPFS
 */
export function getIPFSImageUrl(hash: string): string {
  if (!hash) return '';
  
  // Usar Cloudflare IPFS Gateway
  return `https://cloudflare-ipfs.com/ipfs/${hash}`;
}

