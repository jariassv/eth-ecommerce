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
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-900">Filtros</span>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
          bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-fit sticky top-4
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
              placeholder="Nombre o descripción..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Rango de precios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de Precio (USDT)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange({ minPrice: e.target.value })}
                placeholder={`Min: ${priceRange.min.toFixed(2)}`}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange({ maxPrice: e.target.value })}
                placeholder={`Max: ${priceRange.max.toFixed(2)}`}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}
            </p>
          </div>

          {/* Filtrar por empresa */}
          {companies.size > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(companies.entries()).map(([companyId, companyName]) => (
                  <label
                    key={companyId.toString()}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={filters.selectedCompanies.has(companyId)}
                      onChange={() => handleCompanyToggle(companyId)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{companyName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Solo en stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => handleFilterChange({ inStockOnly: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Solo productos en stock</span>
            </label>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as FilterState['sortBy'] })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

