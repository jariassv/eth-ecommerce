'use client';

import { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useEcommerce } from '@/hooks/useEcommerce';
import { Invoice, Product } from '@/lib/contracts';
import { formatTokenAmount } from '@/lib/ethers';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsTabProps {
  companyId: bigint;
}

interface SalesData {
  date: string;
  sales: number;
  count: number;
}

interface ProductSales {
  productId: string;
  name: string;
  sales: number;
  quantity: bigint;
}

export default function AnalyticsTab({ companyId }: AnalyticsTabProps) {
  const { address, provider, isConnected } = useWallet();
  const { getCompanyInvoices, getCompanyProducts, loading, isReady } = useEcommerce(provider, address);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && isConnected) {
      loadData();
    } else if (!isConnected) {
      setLoadingData(false);
      setError('Debes conectar tu wallet para ver los analytics');
    }
  }, [companyId, isReady, isConnected]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const [companyInvoices, companyProducts] = await Promise.all([
        getCompanyInvoices(companyId),
        getCompanyProducts(companyId),
      ]);
      setInvoices(companyInvoices);
      setProducts(companyProducts);
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Error al cargar datos de analytics');
    } finally {
      setLoadingData(false);
    }
  };

  // Calcular métricas
  const metrics = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.isPaid);
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0n);
    const totalCustomers = new Set(paidInvoices.map(inv => inv.customerAddress)).size;
    const totalOrders = paidInvoices.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / BigInt(totalOrders) : 0n;

    return {
      totalRevenue,
      totalCustomers,
      totalOrders,
      averageOrderValue,
      pendingInvoices: invoices.filter(inv => !inv.isPaid).length,
    };
  }, [invoices]);

  // Preparar datos para gráfico de ventas por período
  const salesByPeriod = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.isPaid);
    const salesMap = new Map<string, { sales: number; count: number }>();

    paidInvoices.forEach(inv => {
      const date = new Date(Number(inv.timestamp) * 1000);
      const dateKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
      
      const current = salesMap.get(dateKey) || { sales: 0, count: 0 };
      current.sales += Number(inv.totalAmount) / 1e6;
      current.count += 1;
      salesMap.set(dateKey, current);
    });

    return Array.from(salesMap.entries())
      .map(([date, data]) => ({ date, sales: data.sales, count: data.count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices]);

  // Preparar datos de productos más vendidos
  const topProducts = useMemo(() => {
    const productSalesMap = new Map<string, { name: string; sales: number; quantity: bigint }>();
    
    const paidInvoices = invoices.filter(inv => inv.isPaid);
    
    // Por ahora, usamos totalSales del producto directamente
    // En una implementación completa, calcularíamos desde invoiceItems
    const sortedProducts = [...products]
      .filter(p => p.totalSales > 0n)
      .sort((a, b) => {
        if (a.totalSales > b.totalSales) return -1;
        if (a.totalSales < b.totalSales) return 1;
        return 0;
      })
      .slice(0, 5)
      .map(p => ({
        productId: p.productId.toString(),
        name: p.name,
        sales: Number(p.totalSales * p.price) / 1e6,
        quantity: p.totalSales,
      }));

    return sortedProducts;
  }, [products, invoices]);

  // Colores para gráficos
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (loadingData || loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Cargando analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-800 font-semibold mb-2">Error al cargar analytics</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Totales"
          value={`$${formatTokenAmount(metrics.totalRevenue, 6)}`}
          subtitle="USDT"
          icon="💰"
          color="indigo"
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics.totalOrders.toString()}
          subtitle="Pedidos completados"
          icon="📦"
          color="purple"
        />
        <MetricCard
          title="Clientes Únicos"
          value={metrics.totalCustomers.toString()}
          subtitle="Clientes totales"
          icon="👥"
          color="pink"
        />
        <MetricCard
          title="Ticket Promedio"
          value={`$${formatTokenAmount(metrics.averageOrderValue, 6)}`}
          subtitle="USDT por pedido"
          icon="📊"
          color="green"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ventas por período */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Período</h3>
          {salesByPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="Ventas (USDT)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No hay datos de ventas disponibles</p>
            </div>
          )}
        </div>

        {/* Gráfico de productos más vendidos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Productos Más Vendidos</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#6366f1" name="Ingresos (USDT)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No hay productos vendidos aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Facturas</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total de Facturas:</span>
              <span className="font-semibold text-gray-900">{invoices.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pagadas:</span>
              <span className="font-semibold text-green-600">
                {invoices.filter(inv => inv.isPaid).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pendientes:</span>
              <span className="font-semibold text-yellow-600">
                {invoices.filter(inv => !inv.isPaid).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Productos Activos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total de Productos:</span>
              <span className="font-semibold text-gray-900">{products.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Activos:</span>
              <span className="font-semibold text-green-600">
                {products.filter(p => p.isActive).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Inactivos:</span>
              <span className="font-semibold text-gray-600">
                {products.filter(p => !p.isActive).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'indigo' | 'purple' | 'pink' | 'green';
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

