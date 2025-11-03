'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { useIPFS, getIPFSImageUrl } from '@/hooks/useIPFS';
import { Product } from '@/lib/contracts';
import { parseTokenAmount } from '@/lib/ethers';

interface ProductFormProps {
  companyId: bigint;
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ companyId, product, onClose, onSuccess }: ProductFormProps) {
  const { address, provider } = useWallet();
  const { addProduct, updateProduct, loading } = useEcommerce(provider, address);
  const { uploadToIPFS, uploading, error: ipfsError } = useIPFS();

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? (parseFloat(product.price.toString()) / 1e6).toString() : '');
  const [stock, setStock] = useState(product?.stock.toString() || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.ipfsImageHash ? getIPFSImageUrl(product.ipfsImageHash) : null
  );
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAdditionalImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !description.trim() || !price || !stock) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (!product && !imageFile) {
      setError('Debes subir una imagen principal para el producto');
      return;
    }

    setProcessing(true);

    try {
      let ipfsImageHash = product?.ipfsImageHash || '';
      let additionalHashes: string[] = product?.ipfsAdditionalImages || [];

      // Subir imagen principal si es nueva
      if (imageFile) {
        ipfsImageHash = await uploadToIPFS(imageFile);
      }

      // Subir imágenes adicionales si hay
      if (additionalImages.length > 0) {
        const uploadPromises = additionalImages.map(file => uploadToIPFS(file));
        additionalHashes = await Promise.all(uploadPromises);
      }

      const priceInWei = parseTokenAmount(price, 6);
      const stockBigInt = BigInt(stock);

      if (product) {
        // Actualizar producto existente (solo precio y stock)
        await updateProduct(product.productId, priceInWei, stockBigInt);
      } else {
        // Crear nuevo producto
        await addProduct(
          name.trim(),
          description.trim(),
          priceInWei,
          stockBigInt,
          ipfsImageHash,
          additionalHashes
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al guardar producto');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {ipfsError && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
              <p className="font-semibold">Advertencia IPFS</p>
              <p className="text-sm">{ipfsError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={processing || uploading}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={processing || uploading}
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Precio (USDT) *
              </label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={processing || uploading}
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                id="stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={processing || uploading}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Imagen Principal {!product && '*'}
              </label>
              {imagePreview && (
                <div className="mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={processing || uploading}
              />
              {uploading && (
                <p className="mt-2 text-sm text-indigo-600">Subiendo imagen a IPFS...</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="additionalImages" className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes Adicionales (opcional)
              </label>
              <input
                type="file"
                id="additionalImages"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={processing || uploading}
              />
              {additionalImages.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {additionalImages.length} imagen(es) seleccionada(s)
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled={processing || uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={processing || uploading}
            >
              {(processing || uploading) ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{uploading ? 'Subiendo...' : 'Guardando...'}</span>
                </>
              ) : (
                <span>{product ? 'Actualizar' : 'Crear'} Producto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

