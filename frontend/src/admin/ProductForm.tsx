import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "./api";
import type { Category, ProductInput } from "./types";
import AdminLayout from "./AdminLayout";

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

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listCategories().then(setCategories);
    if (isEdit && id) {
      api.listProducts().then((products) => {
        const existing = products.find((p) => p.id === Number(id));
        if (existing) {
          const { id: _pid, created_at: _ca, ...rest } = existing;
          setForm(rest);
        }
      });
    }
  }, [id, isEdit]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.category_id) {
      setError("Pick a category before saving.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await api.updateProduct(Number(id), form);
      } else {
        await api.createProduct(form);
      }
      navigate("/admin");
    } catch {
      setError("Couldn't save the product. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <h2 className="font-serif text-2xl mb-6">{isEdit ? "Edit product" : "Add product"}</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-[#1f1c16] border border-[#322d24] rounded-lg p-6 max-w-2xl border-t-2 border-t-dashed border-t-[#c1652f]"
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
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.gender === "men" ? "Men" : "Women"} — {c.name}
              </option>
            ))}
          </select>
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

        <div className="flex gap-6 my-4">
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

        <Field label="Images">
          <div className="flex flex-wrap gap-3 mb-3">
            {form.image_urls.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="w-20 h-24 object-cover rounded border border-[#322d24]" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#b3543f] text-[#ede7db] text-xs leading-5"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <label className="inline-block cursor-pointer text-sm text-[#c1652f] hover:underline">
            {uploading ? "Uploading…" : "+ Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-[#948b7a] text-xs mt-1">1000×1250px (4:5 ratio), under 400KB JPG works best.</p>
        </Field>

        {error && (
          <p className="text-[#b3543f] text-sm mt-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-6 pt-4 border-t border-dashed border-[#322d24]">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#c1652f] text-[#16140f] font-medium rounded px-5 py-2 text-sm hover:bg-[#d17640] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="text-[#948b7a] hover:text-[#ede7db] text-sm px-2"
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
      <label className="block text-xs text-[#948b7a] mb-1.5">{label}</label>
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
        className="w-4 h-4 accent-[#c1652f]"
      />
      {label}
    </label>
  );
}
