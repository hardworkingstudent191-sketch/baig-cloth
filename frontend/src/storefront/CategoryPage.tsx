import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storefrontApi, ApiError } from "./api";
import type { Category, Gender, Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export default function CategoryPage({ gender }: { gender: Gender }) {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    storefrontApi.listCategories(gender).then(setCategories).catch(() => setError(true));
  }, [gender]);

  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const match = categories.find((c) => slugify(c.name) === categorySlug);
      setActiveCategoryId(match?.id);
    } else {
      setActiveCategoryId(undefined);
    }
  }, [categorySlug, categories]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    storefrontApi
      .listProducts({ gender, category_id: activeCategoryId })
      .then(setProducts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gender, activeCategoryId]);

  // Selecting a chip now navigates to /men/lawn (or back to /men for "All"),
  // instead of only updating local state. Previously the URL never changed
  // when you clicked a chip, so the category filter couldn't be bookmarked
  // or shared, and the browser back button didn't restore your previous
  // selection.
  function selectCategory(category: Category | undefined) {
    if (!category) {
      navigate(`/${gender}`);
    } else {
      navigate(`/${gender}/${slugify(category.name)}`);
    }
  }

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
              onClick={() => selectCategory(undefined)}
            />
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                label={c.name}
                active={activeCategoryId === c.id}
                onClick={() => selectCategory(c)}
              />
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-[#6b7280] text-sm">Loading…</p>
        ) : error ? (
          <div className="border border-dashed border-[#dde1e8] rounded-lg p-12 text-center">
            <p className="text-[#1f2937]">Couldn't load products. Check your connection and try again.</p>
          </div>
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
