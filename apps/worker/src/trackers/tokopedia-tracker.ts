import * as cheerio from "cheerio";
import { extractStructuredProduct, fetchMarketplaceHtml, isAllowedHostname, normalizeMarketplaceUrl, parsePrice, ProductTracker, TrackedProduct, TrackerError } from "./product-tracker";

const HOSTS = ["tokopedia.com"] as const;

export class TokopediaTracker implements ProductTracker {
  readonly marketplace = "TOKOPEDIA" as const;
  canHandle(input: string) { try { return isAllowedHostname(new URL(input).hostname, HOSTS); } catch { return false; } }
  normalizeUrl(input: string) { return normalizeMarketplaceUrl(input, HOSTS); }
  async fetchProduct(input: string): Promise<TrackedProduct> {
    const normalized = this.normalizeUrl(input);
    const { html, finalUrl } = await fetchMarketplaceHtml(normalized, HOSTS);
    const $ = cheerio.load(html); const structured = extractStructuredProduct(html);
    const name = $('h1[data-testid="lblPDPDetailProductName"]').text().trim() || structured.name.replace(/^Jual\s+/i, "").split(" - ")[0];
    const price = parsePrice($('div[data-testid="lblPDPDetailProductPrice"]').text()) || structured.price;
    if (!name || price <= 0) throw new TrackerError("PARSE_FAILED", "Detail produk Tokopedia tidak dapat dibaca");
    const canonicalUrl = normalizeMarketplaceUrl(structured.canonicalUrl || finalUrl.toString(), HOSTS).toString();
    return { marketplace: this.marketplace, externalProductId: structured.externalProductId, canonicalUrl, name, price, originalPrice: structured.originalPrice, imageUrl: structured.imageUrl, availability: structured.availability, fetchedAt: new Date(), currency: "IDR", sellerName: structured.sellerName };
  }
}
