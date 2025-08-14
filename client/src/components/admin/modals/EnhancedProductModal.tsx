import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast"; // shadcn hook already used across app
import { cn } from "@/lib/utils";
import useScrollLock from "@/hooks/useScrollLock";

/**
 * Types kept lightweight to avoid tight coupling with server models
 */
export type Product = {
  id?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  brand?: string | null;
  price?: number | string;
  compare_at_price?: number | string | null;
  compareAtPrice?: number | string | null; // compat
  cost?: number | string | null;
  stockQuantity?: number | string;
  stock?: number | string; // compat
  status?: "Active" | "Draft" | "Archived";
  condition?: string;
  weight?: number | string | null;
  sku?: string | null;
  is_featured?: boolean;
  isFeatured?: boolean; // compat
  is_local_delivery_available?: boolean;
  isLocalDeliveryAvailable?: boolean; // compat
  is_shipping_available?: boolean;
  isShippingAvailable?: boolean; // compat
};

export type Category = { id: string; name: string; active?: boolean };

export type Props = {
  product?: Product | null;
  onClose: () => void;
  onSave?: () => void;
  onSaved?: (p: Product) => void;
};

type FulfillmentMode = "local_only" | "shipping_only" | "both";

const modeFromProduct = (p?: Product | null): FulfillmentMode => {
  const local = p?.is_local_delivery_available ?? p?.isLocalDeliveryAvailable ?? false;
  const ship = p?.is_shipping_available ?? p?.isShippingAvailable ?? false;
  if (local && ship) return "both";
  if (local) return "local_only";
  return "shipping_only";
};

const booleansFromMode = (m: FulfillmentMode) => ({
  isLocalDeliveryAvailable: m !== "shipping_only",
  isShippingAvailable: m !== "local_only",
});

const numeric = (v: any, def = 0) => {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : def;
};
const integer = (v: any, def = 0) => {
  const n = parseInt(String(v));
  return Number.isFinite(n) ? n : def;
};

export function EnhancedProductModal({ product, onClose, onSave, onSaved }: Props) {
  const isEdit = !!product?.id;
  const queryClient = useQueryClient();
  useScrollLock(true);
  const modalRef = useRef<HTMLDivElement>(null);

  /** Categories */
  const { data: categories = [], isFetching: loadingCategories } = useQuery<Category[]>({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const res = await fetch("/api/categories?active=true");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  /** Form state */
  const [mode, setMode] = useState<FulfillmentMode>(modeFromProduct(product));
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    brand: product?.brand ?? "",
    price: product?.price ?? "",
    compareAtPrice: (product?.compare_at_price ?? product?.compareAtPrice) ?? "",
    cost: product?.cost ?? "",
    stock: (product?.stockQuantity ?? product?.stock) ?? "",
    status: product?.status ?? "Active",
    condition: (product as any)?.condition ?? "Good",
    weight: product?.weight ?? "",
    sku: product?.sku ?? "",
    isFeatured: product?.is_featured ?? product?.isFeatured ?? false,
    isLocalDeliveryAvailable: product?.is_local_delivery_available ?? product?.isLocalDeliveryAvailable ?? false,
    isShippingAvailable: product?.is_shipping_available ?? product?.isShippingAvailable ?? true,
  }));

  // keep booleans in sync if mode changes from outside
  useEffect(() => {
    setMode(modeFromProduct(product));
    setForm((prev) => ({
      ...prev,
      isLocalDeliveryAvailable: product?.is_local_delivery_available ?? product?.isLocalDeliveryAvailable ?? prev.isLocalDeliveryAvailable,
      isShippingAvailable: product?.is_shipping_available ?? product?.isShippingAvailable ?? prev.isShippingAvailable,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const changeMode = (m: FulfillmentMode) => {
    setMode(m);
    setForm((f) => ({ ...f, ...booleansFromMode(m) }));
  };

  /**
   * Dirty tracking to enable/disable Save button
   */
  const initialSnapshot = useMemo(() => JSON.stringify({ ...form, mode }), []); // first mount snapshot
  useEffect(() => {
    const now = JSON.stringify({ ...form, mode });
    setHasChanges(now !== initialSnapshot);
  }, [form, mode, initialSnapshot]);

  const updateField = (key: keyof typeof form, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = () => {
    if (!form.name?.trim()) {
      toast({ title: "Missing name", description: "Product name is required.", variant: "destructive" });
      return false;
    }
    if (!form.categoryId) {
      toast({ title: "Select a category", description: "Please choose a category.", variant: "destructive" });
      return false;
    }
    const priceOk = numeric(form.price, NaN);
    if (Number.isNaN(priceOk)) {
      toast({ title: "Invalid price", description: "Enter a valid number for price.", variant: "destructive" });
      return false;
    }
    const stockOk = integer(form.stock, NaN);
    if (Number.isNaN(stockOk)) {
      toast({ title: "Invalid stock", description: "Enter a whole number for stock quantity.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;

    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      brand: form.brand || null,
      price: numeric(form.price, 0),
      compareAtPrice: form.compareAtPrice === "" || form.compareAtPrice == null ? null : numeric(form.compareAtPrice, 0),
      cost: form.cost === "" || form.cost == null ? null : numeric(form.cost, 0),
      stockQuantity: integer(form.stock, 0),
      status: form.status,
      condition: form.condition,
      weight: form.weight === "" || form.weight == null ? 0 : numeric(form.weight, 0),
      sku: form.sku || null,

      // booleans — send both cases for backward compatibility
      is_featured: !!form.isFeatured,
      isFeatured: !!form.isFeatured,
      is_local_delivery_available: !!form.isLocalDeliveryAvailable,
      isLocalDeliveryAvailable: !!form.isLocalDeliveryAvailable,
      is_shipping_available: !!form.isShippingAvailable,
      isShippingAvailable: !!form.isShippingAvailable,
    };

    try {
      const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const msg = await safeReadText(res);
        throw new Error(msg || "Save failed");
      }

      // some handlers in logs show undefined content-length; handle empty bodies safely
      let serverProduct: Product | null = null;
      try {
        if (res.headers.get("content-type")?.includes("application/json")) {
          serverProduct = await res.json();
        }
      } catch (_) {}

      // invalidate all product queries so the entire site reflects the change
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminProducts"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["products:featured"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] }),
        isEdit && product?.id
          ? queryClient.invalidateQueries({ queryKey: ["product", product!.id] })
          : Promise.resolve(),
      ]);

      toast({ title: isEdit ? "Product updated" : "Product created", description: "Changes are now live across the site." });

      onSaved?.(serverProduct ?? { ...payload, id: product?.id });
      onSave?.();
      onClose();
    } catch (err: any) {
      console.error("Save error", err);
      toast({ title: "Failed to save product", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={modalRef} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative my-10 w-[min(1100px,96vw)] rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="text-base font-semibold text-white">
            {isEdit ? `Edit Product` : `Add Product`}
            {isEdit && product?.name ? <span className="ml-2 text-slate-400">— {product!.name}</span> : null}
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-300 hover:bg-white/5">✕</button>
        </div>

        <div className="grid gap-6 p-6">
          {/* Product Images (kept as a simple container to preserve your existing image manager) */}
          <section className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
            <div className="mb-3 text-sm font-medium text-white">Product Images</div>
            {/* Mount your existing image manager here if applicable */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="h-24 rounded-lg border border-dashed border-slate-700/70 text-center text-xs text-slate-400 grid place-items-center">
                Use existing image manager
              </div>
            </div>
          </section>

          {/* Basic Information */}
          <section className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
            <div className="mb-4 text-sm font-medium text-white">Basic Information</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-slate-300">Product Name *</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-slate-500"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Category *</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white focus:border-slate-500"
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", e.target.value)}
                >
                  <option value="" disabled>
                    {loadingCategories ? "Loading..." : "Select a category"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Brand</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs text-slate-300">Description</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
            <div className="mb-4 text-sm font-medium text-white">Pricing & Inventory</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-slate-300">Price *</label>
                <input
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Stock Quantity *</label>
                <input
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.stock}
                  onChange={(e) => updateField("stock", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Status</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value as any)}
                >
                  {(["Active", "Draft", "Archived"] as const).map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Condition</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.condition}
                  onChange={(e) => updateField("condition", e.target.value)}
                >
                  {["New", "Like New", "Good", "Fair"].map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">SKU</label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Weight (lbs)</label>
                <input
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Compare at price</label>
                <input
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.compareAtPrice}
                  onChange={(e) => updateField("compareAtPrice", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-300">Cost</label>
                <input
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-sm text-white"
                  value={form.cost}
                  onChange={(e) => updateField("cost", e.target.value)}
                />
              </div>

              <label className="col-span-3 mt-1 inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => updateField("isFeatured", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-transparent text-blue-500"
                />
                Featured Product
              </label>
            </div>
          </section>

          {/* Delivery & Fulfillment Options */}
          <section className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
            <div className="mb-4 text-sm font-medium text-white">Delivery & Fulfillment Options</div>
            <p className="mb-4 text-xs text-slate-400">Choose how customers can receive this product.</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "local_only", label: "Local only" },
                { key: "shipping_only", label: "Shipping only" },
                { key: "both", label: "Local + Shipping" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => changeMode(opt.key as FulfillmentMode)}
                  className={cn(
                    "h-10 rounded-lg border px-3 text-sm",
                    mode === (opt.key as FulfillmentMode)
                      ? "border-blue-400 bg-blue-500/10 text-blue-100"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                  aria-pressed={mode === (opt.key as FulfillmentMode)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-3 text-xs text-slate-400">
              {mode === "local_only" && "This product will only be available for local delivery."}
              {mode === "shipping_only" && "This product will only be available for nationwide shipping."}
              {mode === "both" && "This product will be available for both local delivery and shipping."}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !hasChanges}
            className={cn(
              "rounded-lg px-4 py-2 text-sm",
              saving || !hasChanges
                ? "cursor-not-allowed bg-blue-500/30 text-blue-200"
                : "bg-blue-600 text-white hover:bg-blue-500"
            )}
          >
            {saving ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

async function safeReadText(res: Response) {
  try {
    const t = await res.text();
    return t;
  } catch {
    return "";
  }
}

export default EnhancedProductModal;