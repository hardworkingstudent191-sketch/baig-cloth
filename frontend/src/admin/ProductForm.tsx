import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api, ApiError } from "./api";
import type { Category, ProductInput } from "./types";
import AdminLayout from "./AdminLayout";
import { usePageMeta } from "../usePageMeta";

const emptyProduct: ProductInput = {
  name: "",
  category_id: 0,
  description: "",
  price: "",
  sale_price: null,
  on_sale: false,
  sale_ends_at: null,
  in_stock: true,
  image_urls: [],
  featured: false,
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB — mirrors the backend's limit

// <input type="datetime-local"> works in the browser's local time and has no
// concept of timezone, while the API stores/returns UTC ISO strings. These
// convert between the two so "6pm" in the form is actually 6pm for the
// admin, not 6pm UTC.
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  usePageMeta({ title: `${isEdit ? "Edit" : "New"} Product · Admin`, noindex: true });
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setInitialLoading(true);
      setLoadError(null);
      setNotFound(false);
      try {
        const cats = await api.listCategories();
        if (cancelled) return;
        setCategories(cats);

        if (isEdit && id) {
          // Previously this fetched the ENTIRE product catalog just to find
          // one by id — wasteful, and only worked at all because the admin
          // api client happened to expose listProducts(). Using the actual
          // GET /products/{id} endpoint fixes both.
          const existing = await api.getProduct(Number(id));
          if (cancelled) return;
          const { id: _pid, created_at: _ca, ...rest } = existing;
          setForm(rest);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError("Couldn't load this form. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is too large — please keep uploads under 8MB.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      update("image_urls", [...form.image_urls, url]);
    } catch {
      setError("Image upload failed. Try a smaller JPG/PNG and try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(url: string) {
    update(
      "image_urls",
      form.image_urls.filter((u) => u !== url)
    );
  }

  // The first image is documented as the "primary" one (shown on cards and
  // as the default gallery image), but there was previously no way to
  // reorder images after uploading — only delete-and-reupload in the right
  // order. This lets an admin move any image into the primary slot.
  function moveImage(index: number, direction: -1 | 1) {
    const next = [...form.image_urls];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update("image_urls", next);
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Name can't be empty.";
    if (!form.category_id) return "Pick a category before saving.";

    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0) {
      return "Price must be a number greater than 0.";
    }

    if (form.on_sale) {
      if (!form.sale_price) return "Sale price is required when \u201cOn sale\u201d is checked.";
      const salePrice = Number(form.sale_price);
      if (isNaN(salePrice) || salePrice <= 0) return "Sale price must be a number greater than 0.";
      if (salePrice >= price) return "Sale price must be less than the regular price.";
    }

    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (isEdit && id) {
        await api.updateProduct(Number(id), form);
      } else {
        await api.createProduct(form);
      }
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the product. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <AdminLayout>
        <div className="bg-[#12182a] border border-dashed border-[#24304d] rounded-lg p-10 text-center max-w-2xl">
          <p className="text-[#f2f3f5] mb-1">This product doesn't exist anymore.</p>
          <p className="text-[#7b879e] text-sm mb-4">It may have already been deleted.</p>
          <Link to="/admin" className="text-[#3f5fc4] text-sm hover:underline">
            Back to products
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout>
        <div className="bg-[#12182a] border border-[#c0392b] rounded-lg p-6 max-w-2xl text-[#c0392b] text-sm">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (initialLoading) {
    return (
      <AdminLayout>
        <p className="text-[#7b879e] text-sm">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h2 className="font-serif text-2xl mb-6">{isEdit ? "Edit product" : "Add product"}</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#12182a] border border-[#24304d] rounded-lg p-6 max-w-2xl border-t-2 border-t-dashed border-t-[#3f5fc4]"
      >
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="admin-input"
            required
          />
        </Field>

        <Field label="Category">
          <select
            value={form.category_id || ""}
            onChange={(e) => update("category_id", Number(e.target.value))}
            className="admin-input"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.length === 0 ? (
              <option value="" disabled>
                No categories yet — add one first
              </option>
            ) : (
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.gender === "men" ? "Men" : "Women"} — {c.name}
                </option>
              ))
            )}
          </select>
          {categories.length === 0 && (
            <p className="text-[#7b879e] text-xs mt-1.5">
              <Link to="/admin/categories" className="text-[#3f5fc4] hover:underline">
                Add a category
              </Link>{" "}
              before adding products.
            </p>
          )}
        </Field>

        <Field label="Description (include size info here)">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="admin-input min-h-24"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (Rs)">
            <input
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className="admin-input font-mono"
              inputMode="decimal"
              required
            />
          </Field>
          <Field label="Sale price (Rs, optional)">
            <input
              value={form.sale_price ?? ""}
              onChange={(e) => update("sale_price", e.target.value || null)}
              className="admin-input font-mono"
              inputMode="decimal"
            />
          </Field>
        </div>

        <div className="flex gap-6 my-4 flex-wrap">
          <Checkbox
            label="In stock"
            checked={form.in_stock}
            onChange={(v) => update("in_stock", v)}
          />
          <Checkbox
            label="On sale"
            checked={form.on_sale}
            onChange={(v) => update("on_sale", v)}
          />
          <Checkbox
            label="Featured on homepage"
            checked={form.featured}
            onChange={(v) => update("featured", v)}
          />
        </div>

        {form.on_sale && (
          <Field label="Sale ends (optional)">
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(form.sale_ends_at)}
              onChange={(e) => update("sale_ends_at", fromDatetimeLocalValue(e.target.value))}
              className="admin-input"
            />
            <p className="text-[#7b879e] text-xs mt-1.5">
              Once this passes, the sale badge disappears from the storefront automatically —
              you don't need to come back and turn "On sale" off yourself. Leave blank for an
              open-ended sale.
            </p>
          </Field>
        )}

        <Field label="Images">
          <div className="flex flex-wrap gap-3 mb-3">
            {form.image_urls.map((url, i) => (
              <div key={url} className="relative group/img">
                <img src={url} alt="" className="w-20 h-24 object-cover rounded border border-[#24304d]" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-[#0b0f1a]/80 text-[#7b879e] text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#c0392b] text-[#f2f3f5] text-xs leading-5"
                  aria-label="Remove image"
                >
                  ×
                </button>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move image earlier"
                    className="w-5 h-5 rounded-full bg-[#24304d] text-[#f2f3f5] text-[10px] leading-5 disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === form.image_urls.length - 1}
                    aria-label="Move image later"
                    className="w-5 h-5 rounded-full bg-[#24304d] text-[#f2f3f5] text-[10px] leading-5 disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="inline-block cursor-pointer text-sm text-[#3f5fc4] hover:underline">
            {uploading ? "Uploading…" : "+ Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-[#7b879e] text-xs mt-1">
            1000×1250px (4:5 ratio), under 400KB JPG works best, 8MB max. The first image is used
            as the primary photo — hover any image to reorder.
          </p>
        </Field>

        {error && (
          <p className="text-[#c0392b] text-sm mt-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t border-dashed border-[#24304d]">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#3f5fc4] text-[#0b0f1a] font-medium rounded px-5 py-2 text-sm hover:bg-[#5470d6] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="text-[#7b879e] hover:text-[#f2f3f5] text-sm px-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-[#7b879e] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#3f5fc4]"
      />
      {label}
    </label>
  );
}
