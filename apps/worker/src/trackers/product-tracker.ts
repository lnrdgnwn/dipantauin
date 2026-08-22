export interface TrackedProduct {
  name: string;
  price: number;
  currency: string;
  sellerName?: string;
  canonicalUrl?: string;
}

export interface ProductTracker {
  canHandle(url: string): boolean;
  fetchProduct(url: string): Promise<TrackedProduct>;
}
