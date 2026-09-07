import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { storefrontApi, whatsappLink, ApiError } from "./api";
import type { Category, Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";
import { WHATSAPP_NUMBER } from "./config";
import { usePageMeta } from "../usePageMeta";
import { useJsonLd } from "../useJsonLd";
import WishlistHeart from "./WishlistHeart";
import Breadcrumbs from "./Breadcrumbs";
import RelatedProductsStrip from "./RelatedProductsStrip";
import RecentlyViewedStrip from "./RecentlyViewedStrip";
import { recordView } from "./recentlyViewed";
import Lightbox from "./Lightbox";
import ShareButton from "./ShareButton";
import MobileOrderBar from "./MobileOrderBar";
import { imageUrl, imageSrcSet } from "../cloudinary";

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const ctaRef = useRef<HTMLDivElement>(null);

  // null while the fetch is in flight, so the tab keeps whatever title it had
  // instead of flashing a placeholder on the way to the real product name.
  usePageMeta({
    title: product ? product.name : notFound ? "Not Available" : null,
    description: product
      ? (product.description?.trim().slice(0, 155) ||
        `${product.name} — unstitched fabric at Baig Cloth. Rs ${product.on_sale && product.sale_price ? product.sale_price : product.price}. Order over WhatsApp.`)
      : undefined,
    noindex: notFound,
  });

  useJsonLd(
    product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || undefined,
          image: product.image_urls,
          offers: {
            "@type": "Offer",
            url: window.location.href,
            priceCurrency: "PKR",
            price: product.on_sale && product.sale_price ? product.sale_price : product.price,
            availability: product.in_stock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : null,
  );

  useEffect(() => {
    if (!id) return;
    setNotFound(false);
    setLoadError(false);
    setActiveImage(0);
    storefrontApi
      .getProduct(Number(id))
      .then((p) => {
        setProduct(p);
        recordView(p.id);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(true);
        }
      });
  }, [id]);

  useEffect(() => {
    if (!product) return;
    // Categories don't carry their gender in the Product payload itself, so
    // the breadcrumb (Home > Men/Women > Category) needs one extra lookup.
    // Fetching all categories (both genders) rather than filtering server-side
    // keeps this to a single request regardless of which gender it turns out to be.
    storefrontApi.listCategories().then((cats) => {
      setCategory(cats.find((c) => c.id === product.category_id) ?? null);
    }).catch(() => {});
  }, [product]);

  function handleGalleryMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
    setZoomActive(true);
  }

  if (notFound) {
    return (
      <StorefrontLayout>
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-[#1f2937]">This piece isn't available anymore.</p>
          <Link to="/" className="text-[#223c80] text-sm hover:underline mt-2 inline-block">
            Back to shop
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  if (loadError) {
    return (
      <StorefrontLayout>
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-[#1f2937]">Couldn't load this product. Check your connection and try again.</p>
          <Link to="/" className="text-[#223c80] text-sm hover:underline mt-2 inline-block">
            Back to shop
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/5] bg-[#eef0f3] rounded-lg animate-pulse" />
          <div className="space-y-3">
            <div className="h-8 w-2/3 bg-[#eef0f3] rounded animate-pulse" />
            <div className="h-5 w-1/4 bg-[#eef0f3] rounded animate-pulse" />
            <div className="h-24 w-full bg-[#eef0f3] rounded animate-pulse mt-4" />
            <div className="h-11 w-40 bg-[#eef0f3] rounded animate-pulse mt-6" />
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            ...(category
              ? ([
                  { label: category.gender === "men" ? "Men" : "Women", to: `/${category.gender}` },
                  { label: category.name, to: `/${category.gender}/${slugify(category.name)}` },
                ] as const)
              : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery — thumbnails run as a vertical rail to the left on desktop
            (order-1) and a horizontal row below the image on mobile
            (order-2), from a single list laid out with flex-direction +
            order rather than two separate renders of the same markup. */}
        <div className="md:flex md:gap-3">
          {product.image_urls.length > 1 && (
            <div className="order-2 md:order-1 flex md:flex-col gap-2 mt-3 md:mt-0 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[560px]">
              {product.image_urls.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1} of ${product.image_urls.length}`}
                  aria-pressed={i === activeImage}
                  className={`w-16 h-20 shrink-0 rounded overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-[#223c80]" : "border-transparent hover:border-[#dde1e8]"
                  }`}
                >
                  <img
                    src={imageUrl(url, 160)}
                    width={160}
                    height={200}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="order-1 md:order-2 flex-1 min-w-0">
            <div className="relative aspect-[4/5] bg-[#eef0f3] rounded-lg overflow-hidden border border-[#dde1e8]">
              {product.image_urls.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  onMouseMove={handleGalleryMouseMove}
                  onMouseLeave={() => setZoomActive(false)}
                  className="w-full h-full block cursor-zoom-in"
                  aria-label="View larger image"
                >
                  {/* Every image in the gallery is stacked and crossfaded via
                      opacity rather than swapped by src — switching thumbnails
                      fades between photos instead of popping instantly. Only
                      the active one gets the hover-zoom transform. */}
                  {product.image_urls.map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      srcSet={imageSrcSet(url, [500, 800, 1200])}
                      sizes="(min-width: 768px) 50vw, 100vw"
                      width={1000}
                      height={1250}
                      // The first photo is this page's largest above-the-fold
                      // element — fetch it ahead of everything else. The rest
                      // are stacked behind it at opacity 0 and can wait.
                      fetchPriority={i === 0 ? "high" : "low"}
                      decoding="async"
                      alt={product.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        i === activeImage ? "opacity-100" : "opacity-0"
                      }`}
                      style={
                        i === activeImage && zoomActive
                          ? { transform: "scale(1.9)", transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }
                          : undefined
                      }
                    />
                  ))}
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#6b7280] text-sm">
                  No image
                </div>
              )}
              {product.on_sale && (
                <span className="absolute top-3 left-3 bg-[#1a2f66] text-[#f7f7f5] text-xs uppercase tracking-wide px-2.5 py-1 rounded-sm pointer-events-none">
                  Sale
                </span>
              )}
              <WishlistHeart productId={product.id} productName={product.name} className="absolute top-3 right-3" />
            </div>
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-3xl mb-2">{product.name}</h1>
            <ShareButton title={product.name} />
          </div>

          <p className="font-mono text-lg mb-4">
            {product.on_sale && product.sale_price ? (
              <>
                <span className="line-through text-[#6b7280] mr-2">Rs {product.price}</span>
                <span className="text-[#1a2f66]">Rs {product.sale_price}</span>
              </>
            ) : (
              <span>Rs {product.price}</span>
            )}
          </p>

          {!product.in_stock && (
            <p className="text-[#6b7280] text-sm mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
              Currently out of stock
            </p>
          )}

          {product.on_sale && product.sale_ends_at && (
            <p className="text-[#6b7280] text-xs mb-4">
              Sale ends {new Date(product.sale_ends_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </p>
          )}

          {product.description && (
            <p className="text-[#1f2937] text-sm leading-relaxed mb-6 whitespace-pre-line">
              {product.description}
            </p>
          )}

          <div ref={ctaRef}>
            {product.in_stock ? (
              <a
                href={whatsappLink(product, WHATSAPP_NUMBER)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full md:w-auto px-8 py-3 rounded text-sm font-medium transition-colors bg-[#223c80] text-[#f7f7f5] hover:bg-[#2d4d9e] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#223c80]/20 duration-200"
              >
                Order on WhatsApp
              </a>
            ) : (
              // A real disabled <button>, not a styled-to-look-disabled <a href>.
              // The old version kept a live WhatsApp link underneath the disabled
              // styling, which pointer-events:none doesn't block for keyboard/
              // screen-reader activation — so an "out of stock" item could still
              // be ordered. This can't be activated at all.
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center w-full md:w-auto px-8 py-3 rounded text-sm font-medium bg-[#dde1e8] text-[#6b7280] cursor-not-allowed"
              >
                Out of stock
              </button>
            )}
          </div>

          <p className="text-[#6b7280] text-xs mt-3">
            We'll confirm availability and delivery details over WhatsApp.
          </p>
        </div>
      </div>

      <RelatedProductsStrip categoryId={product.category_id} excludeId={product.id} />
      <RecentlyViewedStrip excludeId={product.id} />

      {/* Mobile-only: reappears once the primary CTA above scrolls out of view. */}
      <MobileOrderBar product={product} watchRef={ctaRef} />

      {lightboxOpen && (
        <Lightbox
          images={product.image_urls}
          index={activeImage}
          onIndexChange={setActiveImage}
          onClose={() => setLightboxOpen(false)}
          alt={product.name}
        />
      )}
    </StorefrontLayout>
  );
}
