'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, Edit2, Package, AlertTriangle, ArrowUpDown, Filter, Layers3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getApiOptions } from '@/lib/tenant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductModal } from '@/components/stock/product-modal';
import { MovementModal } from '@/components/stock/movement-modal';
import type { Product, StockAlert } from '@/types';

export default function StockPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStock = products.filter((p) => p.alerta_stock).length;
    const outOfStock = products.filter((p) => Number(p.stock_current ?? 0) <= 0).length;
    const stockValue = products.reduce((sum, product) => sum + (Number(product.stock_current ?? 0) * Number(product.cost ?? 0)), 0);

    return { totalProducts, lowStock, outOfStock, stockValue };
  }, [products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Product[] }>('/inventory', getApiOptions());
      const productsList = data.data || [];

      // Calcular alertas de stock
      const enrichedProducts = productsList.map((p) => {
        const stock = p.stock_current || 0;
        const minStock = p.minimum_stock || 5;
        let alerta_nivel: 'bajo' | 'critico' | 'agotado' | undefined;
        let alerta_stock = false;

        if (stock <= 0) {
          alerta_nivel = 'agotado';
          alerta_stock = true;
        } else if (stock <= minStock / 2) {
          alerta_nivel = 'critico';
          alerta_stock = true;
        } else if (stock <= minStock) {
          alerta_nivel = 'bajo';
          alerta_stock = true;
        }

        return { ...p, alerta_nivel, alerta_stock };
      });

      setProducts(enrichedProducts);

      // Extraer categorías únicas
      const uniqueCategories = Array.from(new Set(productsList.map((p) => p.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await apiClient.get<{ data: StockAlert[] }>('/stock-alerts', getApiOptions());
      setAlerts(data.data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadAlerts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.sku.toLowerCase().includes(term) ||
          p.name.toLowerCase().includes(term) ||
          (p.brand && p.brand.toLowerCase().includes(term))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (showAlertsOnly) {
      filtered = filtered.filter((p) => p.alerta_stock);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, showAlertsOnly, products]);

  const getAlertBadge = (product: Product) => {
    if (product.alerta_nivel === 'agotado') {
      return <span className="badge-cancelado text-xs">Agotado</span>;
    }
    if (product.alerta_nivel === 'critico') {
      return <span className="badge-reparacion text-xs">Crítico</span>;
    }
    if (product.alerta_nivel === 'bajo') {
      return <span className="badge-diagnostico text-xs">Stock bajo</span>;
    }
    return <span className="badge-listo text-xs">Activo</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Stock</h1>
          <p className="text-srf-muted text-sm mt-1">
            {stats.totalProducts} productos · {stats.lowStock} con stock bajo · {stats.outOfStock} agotados
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setProductModalOpen(true);
          }}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-srf-primary/20 bg-srf-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-srf-muted">Productos activos</div>
            <Layers3 className="h-5 w-5 text-srf-accent" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-srf-primary">{stats.totalProducts}</div>
        </div>
        <div className="rounded-2xl border border-srf-primary/20 bg-srf-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-srf-muted">Stock bajo</div>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-amber-400">{stats.lowStock}</div>
        </div>
        <div className="rounded-2xl border border-srf-primary/20 bg-srf-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-srf-muted">Agotados</div>
            <Package className="h-5 w-5 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-rose-400">{stats.outOfStock}</div>
        </div>
        <div className="rounded-2xl border border-srf-primary/20 bg-srf-surface p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-srf-muted">Valor inventario</div>
            <ArrowUpDown className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-semibold text-srf-primary">
            ${stats.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {stats.lowStock > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Hay {stats.lowStock} producto(s) con stock bajo o agotado.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-srf-primary/20 bg-srf-surface p-4 shadow-soft lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-srf-muted" />
          <Input
            placeholder="Buscar por SKU, nombre, marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-srf-primary/30">
          <input
            type="checkbox"
            checked={showAlertsOnly}
            onChange={(e) => setShowAlertsOnly(e.target.checked)}
            className="accent-srf-accent"
          />
          <span className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> Solo alertas</span>
        </label>
        <Button
          onClick={() => {
            loadProducts();
            loadAlerts();
          }}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Products table */}
      <div className="overflow-x-auto rounded-2xl border border-srf-primary/20 bg-srf-surface shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-srf-bg/60 border-b border-srf-primary/30">
            <tr>
              <th className="text-left py-3 px-4">SKU</th>
              <th className="text-left py-3 px-4">Producto</th>
              <th className="text-left py-3 px-4">Categoría</th>
              <th className="text-left py-3 px-4">Marca</th>
              <th className="text-right py-3 px-4">Stock</th>
              <th className="text-right py-3 px-4">Mínimo</th>
              <th className="text-right py-3 px-4">Costo</th>
              <th className="text-right py-3 px-4">Precio</th>
              <th className="text-left py-3 px-4">Estado</th>
              <th className="text-left py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className={`border-b border-srf-primary/20 hover:bg-srf-surface/50 transition-colors ${
                  product.alerta_stock ? 'bg-red-500/5' : ''
                }`}
              >
                <td className="py-3 px-4 font-mono text-srf-primary">{product.sku}</td>
                <td className="py-3 px-4">
                  <div className="font-medium">{product.name}</div>
                  {(product as Product & { proveedor?: string }).proveedor && (
                    <div className="text-xs text-srf-muted">{(product as Product & { proveedor?: string }).proveedor}</div>
                  )}
                </td>
                <td className="py-3 px-4">{product.category || '—'}</td>
                <td className="py-3 px-4">{product.brand || '—'}</td>
                <td className={`py-3 px-4 text-right font-semibold ${product.alerta_stock ? 'text-yellow-500' : ''}`}>
                  {product.stock_current || 0}
                </td>
                <td className="py-3 px-4 text-right text-srf-muted">{product.minimum_stock || 0}</td>
                <td className="py-3 px-4 text-right">${(product.cost || 0).toFixed(2)}</td>
                <td className="py-3 px-4 text-right">${(product.sale_price || 0).toFixed(2)}</td>
                <td className="py-3 px-4">{getAlertBadge(product)}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-srf-primary/20 text-srf-primary"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setMovementProduct(product);
                        setMovementModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-srf-accent/20 text-srf-accent"
                      title="Ver Kardex"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-8 w-8 text-srf-muted" />
            <p className="mt-3 text-srf-primary font-medium">No hay productos con esos filtros</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={selectedProduct}
        onProductSaved={() => {
          loadProducts();
          loadAlerts();
        }}
      />

      <MovementModal
        open={movementModalOpen}
        onOpenChange={setMovementModalOpen}
        product={movementProduct}
        onMovementSaved={() => {
          loadProducts();
          loadAlerts();
        }}
      />
    </div>
  );
}
