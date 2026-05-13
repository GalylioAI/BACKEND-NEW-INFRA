"use client";

import { useEffect, useState } from "react";

interface SafeImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function SafeImage({
  src,
  fallbackSrc,
  alt,
  className,
  style,
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImageSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={className}
      style={style}
      onError={() => {
        setImageSrc(fallbackSrc);
      }}
    />
  );
}
