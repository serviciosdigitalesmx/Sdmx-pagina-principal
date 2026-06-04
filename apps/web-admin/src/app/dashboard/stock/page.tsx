"use client";

import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, Edit2, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductModal } from "@/components/stock/product-modal";
import { MovementModal } from "@/components/stock/movement-modal";
import type { Product, StockAlert } from "@/types";

export default function StockPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ data: Product[] }>("/inventory", getApiOptions());
      const productsList = data.data || [];
      const enrichedProducts = productsList.map((p) => {
        const stock = p.stock_current || 0;
        const minStock = p.minimum_stock || 5;
        let alerta_nivel: "bajo" | "critico" | "agotado" | undefined;
        let alerta_stock = false;
        if (stock <= 0) {
          alerta_nivel = "agotado";
          alerta_stock = true;
        } else if (stock <= minStock / 2) {
          alerta_nivel = "critico";
          alerta_stock = true;
        } else if (stock <= minStock) {
          alerta_nivel = "bajo";
          alerta_stock = true;
        }
        return { ...p, alerta_nivel, alerta_stock };
      });
      setProducts(enrichedProducts as Product[]);
      setCategories(Array.from(new Set(productsList.map((p) => p.category).filter(Boolean))) as string[]);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await apiClient.get<{ data: StockAlert[] }>("/stock-alerts", getApiOptions());
      setAlerts(data.data || []);
    } catch (error) {
      console.error("Failed to load alerts:", error);
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
      filtered = filtered.filter((p) => p.sku.toLowerCase().includes(term) || p.name.toLowerCase().includes(term) || (p.brand && p.brand.toLowerCase().includes(term)));
    }
    if (categoryFilter) filtered = filtered.filter((p) => p.category === categoryFilter);
    if (showAlertsOnly) filtered = filtered.filter((p) => (p as any).alerta_stock);
    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, showAlertsOnly, products]);

  const getAlertBadge = (product: Product) => {
    if ((product as any).alerta_nivel === "agotado") return <span className="badge-cancelado text-xs">Agotado</span>;
    if ((product as any).alerta_nivel === "critico") return <span className="badge-reparacion text-xs">Crítico</span>;
    if ((product as any).alerta_nivel === "bajo") return <span className="badge-diagnostico text-xs">Stock bajo</span>;
    return <span className="badge-listo text-xs">Activo</span>;
  };

  const lowStockCount = products.filter((p) => (p as any).alerta_stock).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Stock</h1>
          <p className="mt-1 text-sm text-srf-muted">
            {products.length} productos · {lowStockCount} con stock bajo
          </p>
        </div>
        <Button onClick={() => { setSelectedProduct(null); setProductModalOpen(true); }} className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Button>
      </div>

      {lowStockCount > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
          <AlertTriangle className="h-5 w-5" /> Hay {lowStockCount} producto(s) con stock bajo o agotado.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-srf-muted" />
          <Input placeholder="Buscar por SKU, nombre, marca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-40">
          <option value="">Todas las categorías</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-srf-primary/30 px-3 py-2">
          <input type="checkbox" checked={showAlertsOnly} onChange={(e) => setShowAlertsOnly(e.target.checked)} className="accent-srf-accent" />
          <span className="text-sm">Solo alertas</span>
        </label>
        <Button onClick={() => { loadProducts(); loadAlerts(); }} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-srf-primary/30 bg-srf-surface">
            <tr>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Marca</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Mínimo</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className={`border-b border-srf-primary/20 transition-colors hover:bg-srf-surface/50 ${(product as any).alerta_stock ? "bg-red-500/5" : ""}`}>
                <td className="px-4 py-3 font-mono text-srf-primary">{product.sku}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{product.name}</div>
                  {product.proveedor ? <div className="text-xs text-srf-muted">{product.proveedor}</div> : null}
                </td>
                <td className="px-4 py-3">{product.category || "—"}</td>
                <td className="px-4 py-3">{product.brand || "—"}</td>
                <td className={`px-4 py-3 text-right font-semibold ${(product as any).alerta_stock ? "text-yellow-500" : ""}`}>{product.stock_current || 0}</td>
                <td className="px-4 py-3 text-right text-srf-muted">{product.minimum_stock || 0}</td>
                <td className="px-4 py-3 text-right">${(product.cost || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">${(product.sale_price || 0).toFixed(2)}</td>
                <td className="px-4 py-3">{getAlertBadge(product)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedProduct(product); setProductModalOpen(true); }} className="rounded p-1 text-srf-primary hover:bg-srf-primary/20" title="Editar"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => { setMovementProduct(product); setMovementModalOpen(true); }} className="rounded p-1 text-srf-accent hover:bg-srf-accent/20" title="Registrar movimiento"><TrendingUp className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 ? <div className="py-12 text-center"><p className="text-srf-muted">No hay productos con esos filtros</p></div> : null}
      </div>

      <ProductModal open={productModalOpen} onOpenChange={setProductModalOpen} product={selectedProduct} onSaved={() => { loadProducts(); loadAlerts(); }} />
      <MovementModal open={movementModalOpen} onOpenChange={setMovementModalOpen} product={movementProduct} onSaved={() => { loadProducts(); loadAlerts(); }} />
    </div>
  );
}

