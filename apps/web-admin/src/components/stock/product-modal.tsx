"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { Product } from "@/types";

export function ProductModal({ open, onOpenChange, product, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; product: Product | null; onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ sku: "", name: "", stock_current: 0, minimum_stock: 0, cost: 0, sale_price: 0 });

  useEffect(() => {
    setFormData(product ? { sku: product.sku, name: product.name, stock_current: product.stock_current, minimum_stock: product.minimum_stock, cost: product.cost, sale_price: product.sale_price } : { sku: "", name: "", stock_current: 0, minimum_stock: 0, cost: 0, sale_price: 0 });
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await apiClient.patch(`/inventory/${product.id}`, formData, getApiOptions());
      } else {
        await apiClient.post("/inventory", formData, getApiOptions());
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-srf-surface border-srf-primary/40">
        <div className="w-full rounded-xl border border-srf-primary/30 bg-srf-bg p-5">
          <DialogHeader>
            <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div><Label>SKU</Label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
            <div><Label>Nombre</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Stock</Label><Input type="number" value={formData.stock_current} onChange={(e) => setFormData({ ...formData, stock_current: Number(e.target.value) })} /></div>
            <div><Label>Mínimo</Label><Input type="number" value={formData.minimum_stock} onChange={(e) => setFormData({ ...formData, minimum_stock: Number(e.target.value) })} /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

