"use client";

import { useMemo, useState } from "react";
import { safeImageUrl } from "../../lib/product-utils";
import ProductImage from "./ProductImage";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ProductImageGallery({
  images,
  alt,
}: ProductImageGalleryProps) {
  const normalized = useMemo(() => {
    const cleaned = images.map((img) => safeImageUrl(img)).filter(Boolean);
    return [...new Set(cleaned)];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = normalized[activeIndex] || normalized[0];

  return (
    <>
      <ProductImage
        src={activeImage}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          position: "relative",
        }}
      />

      {normalized.length > 1 && (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 12,
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
            zIndex: 2,
          }}
        >
          {normalized.slice(0, 5).map((img, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Afficher image ${index + 1}`}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.95)"
                    : "1px solid rgba(255,255,255,0.28)",
                  padding: 4,
                  background: "rgba(0,0,0,0.45)",
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 0 0 1px rgba(255,255,255,0.35)"
                    : "none",
                }}
              >
                <ProductImage
                  src={img}
                  alt={alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
