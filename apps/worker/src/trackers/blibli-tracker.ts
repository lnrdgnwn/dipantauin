import { extractStructuredProduct, fetchMarketplaceHtml, isAllowedHostname, normalizeMarketplaceUrl, ProductTracker, TrackedProduct, TrackerError } from "./product-tracker";

const HOSTS = ["blibli.com"] as const;

export class BlibliTracker implements ProductTracker {
  readonly marketplace = "BLIBLI" as const;
  canHandle(input: string) { try { return isAllowedHostname(new URL(input).hostname, HOSTS); } catch { return false; } }
  normalizeUrl(input: string) { return normalizeMarketplaceUrl(input, HOSTS); }
  async fetchProduct(input: string): Promise<TrackedProduct> {
    const { html, finalUrl } = await fetchMarketplaceHtml(this.normalizeUrl(input), HOSTS);
    const value = extractStructuredProduct(html);
    if (!value.name || value.price <= 0) throw new TrackerError("PARSE_FAILED", "Detail produk Blibli tidak dapat dibaca");
    const pathMatch = finalUrl.pathname.match(/\/p\/([^/?]+)/);
    return { marketplace: this.marketplace, externalProductId: value.externalProductId || pathMatch?.[1] || null, canonicalUrl: normalizeMarketplaceUrl(value.canonicalUrl || finalUrl.toString(), HOSTS).toString(), name: value.name, price: value.price, originalPrice: value.originalPrice, imageUrl: value.imageUrl, availability: value.availability, fetchedAt: new Date(), currency: "IDR", sellerName: value.sellerName };
  }
}
