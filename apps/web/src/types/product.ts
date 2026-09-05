export interface Product {
  id: string;
  url: string;
  name: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  lastCheckedAt: string | null;
  platform: string | null;
  canonicalUrl: string | null;
  nextCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedProduct {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number | null;
  isActive: boolean;
  notifyOnDrop: boolean;
  notifyOnIncrease: boolean;
  createdAt: string;
  updatedAt: string;
  product: Product;
  priceHistory?: PriceHistory[];
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  checkedAt: string;
}

export interface ProductPreview {
  marketplace: "TOKOPEDIA" | "SHOPEE" | "BLIBLI";
  name: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  canonicalUrl: string;
  fetchedAt: string;
  platform: string | null;
  url: string;
}
