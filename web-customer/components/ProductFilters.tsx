'use client';

import { useState } from 'react';
import { Product } from '@/lib/contracts';

interface ProductFiltersProps {
  products: Product[];
  onFilterChange: (filteredProducts: Product[]) => void;
  companies: Map<bigint, string>;
}

interface FilterState {
  searchTerm: string;
  minPrice: string;
  maxPrice: string;
  selectedCompanies: Set<bigint>;
  sortBy: 'name' | 'price-asc' | 'price-desc' | 'recent';
  inStockOnly: boolean;
}

export default function ProductFilters({ products, onFilterChange, companies }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    minPrice: '',
    maxPrice: '',
    selectedCompanies: new Set(),
    sortBy: 'name',
    inStockOnly: false,
  });

  const [isOpen, setIsOpen] = useState(true);

  const applyFilters = (newFilters: FilterState) => {
    let filtered = [...products];

    // Búsqueda por nombre o descripción
    if (newFilters.searchTerm) {
      const searchLower = newFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por precio mínimo
    if (newFilters.minPrice) {
      const min = parseFloat(newFilters.minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => Number(p.price) / 1e6 >= min);
      }
    }

    // Filtro por precio máximo
    if (newFilters.maxPrice) {
      const max = parseFloat(newFilters.maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => Number(p.price) / 1e6 <= max);
      }
    }

    // Filtro por empresas
    if (newFilters.selectedCompanies.size > 0) {
      filtered = filtered.filter((p) => newFilters.selectedCompanies.has(p.companyId));
    }

    // Filtro por stock
    if (newFilters.inStockOnly) {
      filtered = filtered.filter((p) => p.stock > 0n);
    }

    // Ordenamiento
    switch (newFilters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => {
          const priceA = Number(a.price);
          const priceB = Number(b.price);
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        filtered.sort((a, b) => {
          const priceA = Number(a.price);
          const priceB = Number(b.price);
          return priceB - priceA;
        });
        break;
      case 'recent':
        // Ordenar por productId descendente (asumiendo que IDs más altos son más recientes)
        filtered.sort((a, b) => {
          if (b.productId > a.productId) return 1;
          if (b.productId < a.productId) return -1;
          return 0;
        });
        break;
    }

    onFilterChange(filtered);
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleCompanyToggle = (companyId: bigint) => {
    const newSelected = new Set(filters.selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    handleFilterChange({ selectedCompanies: newSelected });
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: '',
      minPrice: '',
      maxPrice: '',
      selectedCompanies: new Set(),
      sortBy: 'name',
      inStockOnly: false,
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  // Calcular estadísticas para los filtros
  const priceRange = {
    min: Math.min(...products.map((p) => Number(p.price) / 1e6)),
    max: Math.max(...products.map((p) => Number(p.price) / 1e6)),
  };

  const activeFiltersCount =
    (filters.searchTerm ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    filters.selectedCompanies.size +
    (filters.inStockOnly ? 1 : 0) +
    (filters.sortBy !== 'name' ? 1 : 0);

  return (
    <>
      {/* Botón para abrir/cerrar en móvil */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-6 py-4 bg-white border-2 border-gray-300 rounded-xl shadow-md hover:bg-gray-50 hover:border-indigo-300 transition-all"
        >
          <span className="text-lg font-bold text-gray-900">Filtros</span>
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <svg
              className={`w-6 h-6 text-gray-600 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Panel de filtros */}
      <div
        className={`
          ${isOpen ? 'block' : 'hidden lg:block'}
          bg-white rounded-xl shadow-lg border border-gray-200 p-8 h-fit sticky top-4
        `}
      >
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Filtros</h3>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="space-y-8">
          {/* Búsqueda */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Buscar
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
              placeholder="Nombre o descripción..."
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Rango de precios */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Rango de Precio (USDT)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                placeholder={`Min: ${priceRange.min.toFixed(2)}`}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
                placeholder={`Max: ${priceRange.max.toFixed(2)}`}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}
            </p>
          </div>

          {/* Filtrar por empresa */}
          {companies.size > 0 && (
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-3">
                Empresa
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {Array.from(companies.entries()).map(([companyId, companyName]) => (
                  <label
                    key={companyId.toString()}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedCompanies.has(companyId)}
                      onChange={() => handleCompanyToggle(companyId)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-base text-gray-700">{companyName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Solo en stock */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => handleFilterChange({ inStockOnly: e.target.checked })}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-base font-semibold text-gray-700">Solo productos en stock</span>
            </label>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Ordenar por
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer transition-all"
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="recent">Más Recientes</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

