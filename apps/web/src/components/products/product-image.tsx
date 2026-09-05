"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/images/product-placeholder.svg";
const MARKETPLACE_HOSTS = [
  "tokopedia.net",
  "tokopedia-static.net",
  "susercontent.com",
  "shopee.co.id",
  "static-src.com",
];

function isMarketplaceImage(src: ImageProps["src"]) {
  if (typeof src !== "string") return false;

  try {
    const hostname = new URL(src).hostname;
    return MARKETPLACE_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

type ProductImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
};

function ProductImageRenderer({ src, alt, ...props }: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_IMAGE);
  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      unoptimized={isMarketplaceImage(imageSrc)}
      onError={() => {
        if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE);
      }}
    />
  );
}

export function ProductImage(props: ProductImageProps) {
  return <ProductImageRenderer key={props.src || FALLBACK_IMAGE} {...props} />;
}
