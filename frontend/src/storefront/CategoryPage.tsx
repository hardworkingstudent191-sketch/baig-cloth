import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { storefrontApi } from "./api";
import type { Category, Gender, Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";

export default function CategoryPage({ gender }: { gender: Gender }) {
  const { category: categorySlug } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storefrontApi.listCategories(gender).then(setCategories);
  }, [gender]);

  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const match = categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, "-") === categorySlug
      );
      setActiveCategoryId(match?.id);
    } else {
      setActiveCategoryId(undefined);
    }
  }, [categorySlug, categories]);

  useEffect(() => {
    setLoading(true);
    storefrontApi
      .listProducts({ gender, category_id: activeCategoryId })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [gender, activeCategoryId]);

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-1 capitalize">{gender}</h1>
        <p className="text-[#6b7280] text-sm mb-6">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>

        {/* Subcategory filter chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
            <FilterChip
              label="All"
              active={activeCategoryId === undefined}
              onClick={() => setActiveCategoryId(undefined)}
            />
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                active={activeCategoryId === c.id}
                onClick={() => setActiveCategoryId(c.id)}
              />
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-[#6b7280] text-sm">Loading…</p>
        ) : products.length === 0 ? (
          <div className="border border-dashed border-[#dde1e8] rounded-lg p-12 text-center">
            <p className="text-[#1f2937]">Nothing here yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? "bg-[#101014] text-[#f7f7f5] border-[#101014]"
          : "border-[#dde1e8] text-[#1f2937] hover:border-[#6b7280]"
      }`}
    >
      {label}
    </button>
  );
}
