"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { PRODUCT_IMAGE_FALLBACK, safeImageUrl } from "../../lib/product-utils";

export default function ProductImage({
  src,
  alt,
  style,
}: {
  src?: string | null;
  alt: string;
  style?: CSSProperties;
}) {
  const [image, setImage] = useState(safeImageUrl(src));

  useEffect(() => {
    setImage(safeImageUrl(src));
  }, [src]);

  return <img src={image} alt={alt} onError={() => setImage(PRODUCT_IMAGE_FALLBACK)} style={style} />;
}
