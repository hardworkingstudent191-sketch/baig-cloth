import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import type { Category, Product } from "./types";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData] = await Promise.all([
        api.listProducts(),
        api.listCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch {
      setError("Couldn't load products. Check the API connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleInStock(product: Product) {
    const updated = await api.updateProduct(product.id, { in_stock: !product.in_stock });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  }

  async function toggleOnSale(product: Product) {
    const updated = await api.updateProduct(product.id, { on_sale: !product.on_sale });
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Remove "${product.name}" for good? This can't be undone.`)) return;
    await api.deleteProduct(product.id);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  function categoryName(id: number) {
    return categories.find((c) => c.id === id)?.name ?? "—";
  }

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.in_stock).length,
    onSale: products.filter((p) => p.on_sale).length,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl">Products</h2>
        <Link
          to="/admin/products/new"
          className="bg-[#c1652f] text-[#16140f] font-medium rounded px-4 py-2 text-sm hover:bg-[#d17640] transition-colors"
        >
          + Add product
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total products" value={stats.total} />
        <StatCard label="In stock" value={stats.inStock} accent="#7a9b6e" />
        <StatCard label="On sale" value={stats.onSale} accent="#c1652f" />
      </div>

      {error && (
        <div className="bg-[#1f1c16] border border-[#b3543f] rounded-lg p-4 mb-4 text-[#b3543f] text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#948b7a] text-sm">Loading products…</p>
      ) : products.length === 0 ? (
        <div className="bg-[#1f1c16] border border-dashed border-[#322d24] rounded-lg p-10 text-center">
          <p className="text-[#ede7db] mb-1">No products yet</p>
          <p className="text-[#948b7a] text-sm mb-4">Add your first piece to get the storefront started.</p>
          <Link to="/admin/products/new" className="text-[#c1652f] text-sm hover:underline">
            + Add product
          </Link>
        </div>
      ) : (
        <div className="bg-[#1f1c16] border border-[#322d24] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dashed border-[#322d24] text-left text-[#948b7a]">
                <th className="px-4 py-3 font-normal">Product</th>
                <th className="px-4 py-3 font-normal">Category</th>
                <th className="px-4 py-3 font-normal">Price</th>
                <th className="px-4 py-3 font-normal">In stock</th>
                <th className="px-4 py-3 font-normal">On sale</th>
                <th className="px-4 py-3 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[#322d24] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_urls[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt=""
                          className="w-10 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-12 bg-[#16140f] rounded border border-[#322d24]" />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#948b7a]">{categoryName(product.category_id)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {product.on_sale && product.sale_price ? (
                      <>
                        <span className="line-through text-[#948b7a] mr-1.5">Rs {product.price}</span>
                        <span className="text-[#c1652f]">Rs {product.sale_price}</span>
                      </>
                    ) : (
                      <span>Rs {product.price}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ToggleChip active={product.in_stock} onClick={() => toggleInStock(product)} />
                  </td>
                  <td className="px-4 py-3">
                    <ToggleChip
                      active={product.on_sale}
                      onClick={() => toggleOnSale(product)}
                      activeColor="#c1652f"
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="text-[#948b7a] hover:text-[#ede7db] text-xs mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      className="text-[#948b7a] hover:text-[#b3543f] text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  accent = "#ede7db",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-[#1f1c16] border border-[#322d24] rounded-lg px-4 py-3">
      <p className="text-[#948b7a] text-xs mb-1">{label}</p>
      <p className="font-serif text-2xl" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  activeColor = "#7a9b6e",
}: {
  active: boolean;
  onClick: () => void;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-5 rounded-full relative transition-colors"
      style={{ backgroundColor: active ? activeColor : "#322d24" }}
      aria-pressed={active}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-[#ede7db] transition-all"
        style={{ left: active ? "18px" : "2px" }}
      />
    </button>
  );
}
