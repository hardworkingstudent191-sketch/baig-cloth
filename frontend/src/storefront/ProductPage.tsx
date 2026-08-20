import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { storefrontApi, whatsappLink } from "./api";
import type { Product } from "./types";
import StorefrontLayout from "./StorefrontLayout";

const WHATSAPP_NUMBER = "923001234567"; // TODO: replace with your real number

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    storefrontApi
      .getProduct(Number(id))
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [id]);

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

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="text-[#6b7280] text-sm">Loading…</p>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] bg-[#eef0f3] rounded-lg overflow-hidden border border-[#dde1e8]">
            {product.image_urls[activeImage] ? (
              <img
                src={product.image_urls[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6b7280] text-sm">
                No image
              </div>
            )}
            {product.on_sale && (
              <span className="absolute top-3 left-3 bg-[#1a2f66] text-[#f7f7f5] text-xs uppercase tracking-wide px-2.5 py-1 rounded-sm">
                Sale
              </span>
            )}
          </div>

          {product.image_urls.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.image_urls.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-20 rounded overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-[#223c80]" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="font-serif text-3xl mb-2">{product.name}</h1>

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
            <p className="text-[#1a2f66] text-sm mb-4">Currently out of stock</p>
          )}

          {product.description && (
            <p className="text-[#1f2937] text-sm leading-relaxed mb-6 whitespace-pre-line">
              {product.description}
            </p>
          )}

          <a
            href={whatsappLink(product, WHATSAPP_NUMBER)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center w-full md:w-auto px-8 py-3 rounded text-sm font-medium transition-colors ${
              product.in_stock
                ? "bg-[#223c80] text-[#f7f7f5] hover:bg-[#2d4d9e]"
                : "bg-[#dde1e8] text-[#6b7280] cursor-not-allowed pointer-events-none"
            }`}
          >
            {product.in_stock ? "Order on WhatsApp" : "Out of stock"}
          </a>

          <p className="text-[#6b7280] text-xs mt-3">
            We'll confirm availability and delivery details over WhatsApp.
          </p>
        </div>
      </div>
    </StorefrontLayout>
  );
}
