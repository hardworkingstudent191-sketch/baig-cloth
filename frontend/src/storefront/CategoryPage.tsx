import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storefrontApi, ApiError } from "./api";
import type { Category, Gender, Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";
import { usePageMeta } from "../usePageMeta";
import { useJsonLd } from "../useJsonLd";
import Breadcrumbs from "./Breadcrumbs";
import Reveal from "../Reveal";
import SortSelect from "./SortSelect";
import { sortProducts, type SortOption } from "./sortProducts";
import CategoryVideoBanner from "./CategoryVideoBanner";

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export default function CategoryPage({ gender }: { gender: Gender }) {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>();
  const [sort, setSort] = useState<SortOption>("newest");
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

  const genderLabel = gender === "men" ? "Men's" : "Women's";
  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const sortedProducts = sortProducts(products, sort);

  usePageMeta({
    title: activeCategory ? `${genderLabel} ${activeCategory.name}` : `${genderLabel} Unstitched Fabric`,
    description: activeCategory
      ? `${genderLabel} ${activeCategory.name} unstitched fabric at Baig Cloth. Browse the range and order over WhatsApp.`
      : `Browse ${genderLabel.toLowerCase()} unstitched fabric at Baig Cloth — lawn, cotton, wash-and-wear and embroidered pieces, ordered over WhatsApp.`,
  });

  useJsonLd(
    !loading && products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${window.location.origin}/product/${p.id}`,
          })),
        }
      : null,
  );

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
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            ...(activeCategory
              ? [{ label: gender === "men" ? "Men" : "Women", to: `/${gender}` }, { label: activeCategory.name }]
              : [{ label: gender === "men" ? "Men" : "Women" }])
          ]}
        />
        {activeCategoryId === undefined && <CategoryVideoBanner gender={gender} />}
        <h1 className="font-serif text-3xl mb-1 capitalize">{gender}</h1>
        <p className="text-[#6b7280] text-sm mb-6">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>

        {/* Subcategory filter chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
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

        {products.length > 0 && (
          <div className="flex justify-end mb-4">
            <SortSelect value={sort} onChange={setSort} />
          </div>
        )}

        {loading ? (
          <ProductGridSkeleton />
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
            {sortedProducts.map((p, i) => (
              <Reveal key={p.id} delayMs={(i % 4) * 60}>
                <ProductCard product={p} />
              </Reveal>
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
