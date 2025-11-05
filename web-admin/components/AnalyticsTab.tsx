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
  AreaChart,
  Area,
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
  quantity: number;
}

// Iconos SVG profesionales
const RevenueIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const OrdersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const CustomersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const AverageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function AnalyticsTab({ companyId }: AnalyticsTabProps) {
  const { address, provider, isConnected } = useWallet();
  const { getCompanyInvoices, getCompanyProducts, getInvoiceItems, loading, isReady } = useEcommerce(provider, address);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceItemsMap, setInvoiceItemsMap] = useState<Map<bigint, Array<{ productId: bigint; quantity: bigint }>>>(new Map());
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para obtener la dirección del token EURT
  const getEURTTokenAddress = () => {
    if (typeof window === 'undefined') return '';
    return process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '';
  };

  // Helper para convertir totalAmount a USDT
  // Si la factura fue pagada en EURT, usamos expectedTotalUSDT si está disponible
  // Si no, usamos totalAmount directamente (asumiendo que está en USDT)
  const getAmountInUSDT = (invoice: Invoice): bigint => {
    const eurtAddress = getEURTTokenAddress().toLowerCase();
    const invoicePaymentToken = (invoice.paymentToken || '').toLowerCase();
    
    // Si paymentToken es address(0) o vacío, asumimos USDT (facturas antiguas)
    if (!invoicePaymentToken || invoicePaymentToken === '0x0000000000000000000000000000000000000000') {
      return invoice.totalAmount;
    }
    
    // Si tenemos expectedTotalUSDT > 0, significa que la factura fue pagada en EURT
    // y tenemos el valor esperado en USDT, así que lo usamos
    if (invoice.expectedTotalUSDT > 0n) {
      return invoice.expectedTotalUSDT;
    }
    
    // Si la factura fue pagada en EURT pero no tenemos expectedTotalUSDT
    if (eurtAddress && invoicePaymentToken === eurtAddress) {
      console.warn(`Invoice ${invoice.invoiceId} pagada en EURT pero sin expectedTotalUSDT, usando totalAmount como fallback`);
      return invoice.totalAmount;
    }
    
    // Si no es EURT, asumimos USDT
    return invoice.totalAmount;
  };

  useEffect(() => {
    if (isReady && isConnected) {
      loadData();
    } else if (!isConnected) {
      setLoadingData(false);
      setError('Debes conectar tu wallet para ver los analytics');
    } else {
      setLoadingData(true);
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

      // Cargar items de todas las facturas pagadas
      const paidInvoices = companyInvoices.filter(inv => inv.isPaid);
      
      const itemsMap = new Map<bigint, Array<{ productId: bigint; quantity: bigint }>>();
      
      for (const invoice of paidInvoices) {
        try {
          const items = await getInvoiceItems(invoice.invoiceId);
          itemsMap.set(invoice.invoiceId, items);
        } catch (err) {
          console.error(`Error loading items for invoice ${invoice.invoiceId}:`, err);
        }
      }
      
      setInvoiceItemsMap(itemsMap);
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
    
    // Convertir todos los ingresos a USDT para el total
    const totalRevenue = paidInvoices.reduce((sum, inv) => {
      const amountInUSDT = getAmountInUSDT(inv);
      return sum + amountInUSDT;
    }, 0n);
    
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  // Preparar datos para gráfico de ventas por período
  const salesByPeriod = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.isPaid);
    const salesMap = new Map<string, { sales: number; count: number }>();

    paidInvoices.forEach(inv => {
      const date = new Date(Number(inv.timestamp) * 1000);
      const dateKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
      
      const current = salesMap.get(dateKey) || { sales: 0, count: 0 };
      // Convertir a USDT usando la función helper
      const amountInUSDT = getAmountInUSDT(inv);
      current.sales += Number(amountInUSDT) / 1e6;
      current.count += 1;
      salesMap.set(dateKey, current);
    });

    const allData = Array.from(salesMap.entries())
      .map(([date, data]) => ({ date, sales: data.sales, count: data.count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Mostrar todos los datos
    return allData;
  }, [invoices]);

  // Preparar datos de productos más vendidos (calculado desde invoiceItems)
  const topProducts = useMemo(() => {
    const productSalesMap = new Map<string, { name: string; sales: number; quantity: number }>();
    
    const paidInvoices = invoices.filter(inv => inv.isPaid);
    
    // Calcular ventas desde invoiceItems
    paidInvoices.forEach(invoice => {
      const items = invoiceItemsMap.get(invoice.invoiceId) || [];
      items.forEach(item => {
        const product = products.find(p => p.productId === item.productId);
        if (product) {
          const existing = productSalesMap.get(product.productId.toString()) || {
            name: product.name,
            sales: 0,
            quantity: 0,
          };
          // Calcular ventas: cantidad * precio del producto
          const itemTotal = Number(item.quantity * product.price) / 1e6;
          existing.sales += itemTotal;
          existing.quantity += Number(item.quantity);
          productSalesMap.set(product.productId.toString(), existing);
        }
      });
    });

    return Array.from(productSalesMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [products, invoices, invoiceItemsMap]);

  // Datos para gráfico de ingresos vs pedidos
  const revenueVsOrders = useMemo(() => {
    return salesByPeriod.map(period => ({
      date: period.date,
      ingresos: period.sales,
      pedidos: period.count,
    }));
  }, [salesByPeriod]);

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
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ingresos Totales"
          value={`$${formatTokenAmount(metrics.totalRevenue, 6)}`}
          subtitle="USDT"
          icon={<RevenueIcon className="w-6 h-6" />}
          color="indigo"
          trend={salesByPeriod.length > 1 ? (
            salesByPeriod[salesByPeriod.length - 1].sales > salesByPeriod[salesByPeriod.length - 2].sales ? 'up' : 'down'
          ) : undefined}
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics.totalOrders.toString()}
          subtitle="Pedidos completados"
          icon={<OrdersIcon className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Clientes Únicos"
          value={metrics.totalCustomers.toString()}
          subtitle="Clientes totales"
          icon={<CustomersIcon className="w-6 h-6" />}
          color="pink"
        />
        <MetricCard
          title="Ticket Promedio"
          value={`$${formatTokenAmount(metrics.averageOrderValue, 6)}`}
          subtitle="USDT por pedido"
          icon={<AverageIcon className="w-6 h-6" />}
          color="green"
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ventas por período */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Ventas por Período</h3>
            <p className="text-sm text-gray-500">
              {salesByPeriod.length > 14 
                ? `Últimos ${salesByPeriod.length} días (mostrando todos los períodos)`
                : `${salesByPeriod.length} ${salesByPeriod.length === 1 ? 'período' : 'períodos'}`
              }
            </p>
          </div>
          {salesByPeriod.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesByPeriod}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorSales)"
                  name="Ventas (USDT)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <OrdersIcon className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm">No hay datos de ventas disponibles</p>
            </div>
          )}
        </div>

        {/* Gráfico de productos más vendidos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Productos Más Vendidos</h3>
            <p className="text-sm text-gray-500">Top 5 por ingresos</p>
          </div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `$${value.toFixed(2)}`,
                    `Ingresos (Cantidad: ${props.payload.quantity})`
                  ]}
                  labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#6366f1" 
                  radius={[0, 8, 8, 0]}
                  name="Ingresos (USDT)"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <OrdersIcon className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm">No hay productos vendidos aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de ingresos vs pedidos */}
      {revenueVsOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Ingresos vs Pedidos</h3>
            <p className="text-sm text-gray-500">Comparación diaria</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueVsOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'ingresos' ? `$${value.toFixed(2)}` : value.toString(),
                  name === 'ingresos' ? 'Ingresos' : 'Pedidos'
                ]}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ingresos"
                stroke="#6366f1"
                strokeWidth={2}
                name="Ingresos (USDT)"
                dot={{ fill: '#6366f1', r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pedidos"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Pedidos"
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Facturas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total de Facturas:</span>
              <span className="font-semibold text-gray-900 text-lg">{invoices.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Pagadas:</span>
              <span className="font-semibold text-green-600 text-lg">
                {invoices.filter(inv => inv.isPaid).length}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Pendientes:</span>
              <span className="font-semibold text-yellow-600 text-lg">
                {invoices.filter(inv => !inv.isPaid).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Productos Activos</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total de Productos:</span>
              <span className="font-semibold text-gray-900 text-lg">{products.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Activos:</span>
              <span className="font-semibold text-green-600 text-lg">
                {products.filter(p => p.isActive).length}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Inactivos:</span>
              <span className="font-semibold text-gray-600 text-lg">
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
  icon: React.ReactNode;
  color: 'indigo' | 'purple' | 'pink' | 'green';
  trend?: 'up' | 'down';
}

function MetricCard({ title, value, subtitle, icon, color, trend }: MetricCardProps) {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'border-indigo-200',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200',
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'text-pink-600',
      border: 'border-pink-200',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white rounded-xl border ${colors.border} shadow-sm p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
        )}
      </div>
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
