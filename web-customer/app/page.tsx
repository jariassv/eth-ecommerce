'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Product } from '@/lib/contracts';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import FloatingCartButton from '@/components/FloatingCartButton';
import ProductFilters from '@/components/ProductFilters';

export default function Home() {
  const { provider, address } = useWallet();
  const { getAllProducts, getCompany, loading, error, isReady } = useEcommerce(provider, address);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [companies, setCompanies] = useState<Map<bigint, string>>(new Map());

  useEffect(() => {
    if (isReady) {
      loadProducts();
    }
  }, [isReady]);

  const loadProducts = async () => {
    if (!isReady) {
      // Esperar a que el contrato esté listo
      return;
    }

    setLoadingProducts(true);
    try {
      const products = await getAllProducts();
      setAllProducts(products);
      setFilteredProducts(products);

      // Cargar información de empresas
      const companiesMap = new Map<bigint, string>();
      const uniqueCompanyIds = new Set(products.map((p) => p.companyId));
      
      for (const companyId of uniqueCompanyIds) {
        try {
          const company = await getCompany(companyId);
          companiesMap.set(companyId, company.name);
        } catch (err) {
          console.error(`Error loading company ${companyId}:`, err);
          companiesMap.set(companyId, `Empresa #${companyId.toString()}`);
        }
      }
      
      setCompanies(companiesMap);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                Marketplace Descentralizado
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 mb-8">
                Compra productos con tokens USDT en blockchain
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Pagos Seguros</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Blockchain</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verificado</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="container mx-auto px-4 lg:px-8 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Catálogo de Productos
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length > 0 
                  ? `${filteredProducts.length} de ${allProducts.length} productos`
                  : allProducts.length > 0 
                    ? `0 de ${allProducts.length} productos`
                    : 'Explora nuestros productos'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 shadow-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loadingProducts || loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 text-lg font-medium">Cargando productos...</p>
            </div>
          ) : allProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-200">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Por favor, verifica que el contrato Ecommerce esté desplegado y tenga productos registrados.
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Panel de Filtros */}
              <div className="lg:w-64 flex-shrink-0">
                <ProductFilters
                  products={allProducts}
                  onFilterChange={setFilteredProducts}
                  companies={companies}
                />
              </div>

              {/* Grid de Productos */}
              <div className="flex-1">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-200">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No se encontraron productos
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Intenta ajustar los filtros para ver más resultados.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.productId.toString()}
                        product={product}
                        onAddToCart={loadProducts}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="font-medium">Blockchain Market - E-commerce Descentralizado</p>
            <p className="text-sm mt-2">Powered by Ethereum & Smart Contracts</p>
          </div>
        </div>
      </footer>

      {/* Botón flotante de carrito */}
      <FloatingCartButton />
    </div>
  );
}
