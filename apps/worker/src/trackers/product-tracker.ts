import * as cheerio from "cheerio";

export type Marketplace = "TOKOPEDIA" | "SHOPEE" | "BLIBLI";
export type Availability = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";

export interface TrackedProduct {
  marketplace: Marketplace;
  externalProductId: string | null;
  canonicalUrl: string;
  name: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  availability: Availability;
  fetchedAt: Date;
  currency: "IDR";
  sellerName?: string;
}

export interface ProductTracker {
  readonly marketplace: Marketplace;
  canHandle(url: string): boolean;
  normalizeUrl(url: string): URL;
  fetchProduct(url: string): Promise<TrackedProduct>;
}

export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export class TrackerError extends Error {
  constructor(public readonly code: "INVALID_URL" | "UNSUPPORTED" | "NOT_FOUND" | "BLOCKED" | "TIMEOUT" | "TOO_LARGE" | "PARSE_FAILED" | "NETWORK", message: string) {
    super(message);
    this.name = "TrackerError";
  }
}

const MAX_RESPONSE_BYTES = 2_000_000;
const USER_AGENT = "Dipantauin/1.0 (+price-monitor)";

export function isAllowedHostname(hostname: string, allowed: readonly string[]) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return allowed.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

export function normalizeMarketplaceUrl(input: string, allowed: readonly string[]) {
  let url: URL;
  try { url = new URL(input); } catch { throw new TrackerError("INVALID_URL", "Tautan produk tidak valid"); }
  if (url.protocol !== "https:" || !isAllowedHostname(url.hostname, allowed)) throw new TrackerError("UNSUPPORTED", "Domain marketplace tidak didukung");
  url.username = ""; url.password = ""; url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (key.startsWith("utm_") || ["src", "ref", "aff_unique_id"].includes(key)) url.searchParams.delete(key);
  return url;
}

export async function fetchMarketplaceHtml(input: URL, allowed: readonly string[]) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let current = input;
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      const response = await fetch(current, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "id-ID,id;q=0.9" } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location || redirects === 3) throw new TrackerError("NETWORK", "Redirect marketplace tidak valid");
        current = normalizeMarketplaceUrl(new URL(location, current).toString(), allowed);
        continue;
      }
      if (response.status === 404) throw new TrackerError("NOT_FOUND", "Produk tidak ditemukan");
      if (response.status === 403 || response.status === 429) throw new TrackerError("BLOCKED", "Marketplace membatasi permintaan. Coba lagi nanti");
      if (!response.ok) throw new TrackerError("NETWORK", `Marketplace merespons HTTP ${response.status}`);
      if (Number(response.headers.get("content-length") || 0) > MAX_RESPONSE_BYTES) throw new TrackerError("TOO_LARGE", "Respons marketplace terlalu besar");
      const reader = response.body?.getReader();
      if (!reader) throw new TrackerError("NETWORK", "Respons marketplace kosong");
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new TrackerError("TOO_LARGE", "Respons marketplace terlalu besar"); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { html: new TextDecoder().decode(bytes), finalUrl: current };
    }
    throw new TrackerError("NETWORK", "Terlalu banyak redirect");
  } catch (error) {
    if (error instanceof TrackerError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new TrackerError("TIMEOUT", "Marketplace tidak merespons tepat waktu");
    throw new TrackerError("NETWORK", "Tidak dapat mengambil halaman marketplace");
  } finally { clearTimeout(timer); }
}

type JsonLdProduct = { name?: string; image?: string | string[]; sku?: string; productID?: string; offers?: { price?: string | number; highPrice?: string | number; availability?: string }; brand?: { name?: string } };

export function extractStructuredProduct(html: string) {
  const $ = cheerio.load(html); let product: JsonLdProduct | undefined;
  $('script[type="application/ld+json"]').each((_, element) => {
    if (product) return;
    try {
      const value = JSON.parse($(element).text()) as JsonLdProduct | JsonLdProduct[] | { "@graph"?: JsonLdProduct[] };
      const candidates: JsonLdProduct[] = Array.isArray(value)
        ? value
        : "@graph" in value
          ? value["@graph"] || []
          : [value as JsonLdProduct];
      product = candidates.find((item) => item && (item as { "@type"?: string })["@type"] === "Product");
    } catch { /* malformed third-party JSON-LD */ }
  });
  const price = parsePrice(product?.offers?.price ?? $("meta[property='product:price:amount']").attr("content"));
  const originalPrice = parsePrice(product?.offers?.highPrice);
  const image = Array.isArray(product?.image) ? product.image[0] : product?.image;
  return { name: product?.name?.trim() || $("meta[property='og:title']").attr("content")?.trim() || "", price, originalPrice: originalPrice > price ? originalPrice : null, imageUrl: image || $("meta[property='og:image']").attr("content") || null, externalProductId: product?.sku || product?.productID || null, sellerName: product?.brand?.name, availability: parseAvailability(product?.offers?.availability), canonicalUrl: $("link[rel='canonical']").attr("href") || null };
}

export function parsePrice(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^0-9]/g, ""); return normalized ? Number.parseInt(normalized, 10) : 0;
}

function parseAvailability(value?: string): Availability {
  if (!value) return "UNKNOWN";
  if (/OutOfStock|SoldOut/i.test(value)) return "UNAVAILABLE";
  if (/InStock|PreOrder|LimitedAvailability/i.test(value)) return "AVAILABLE";
  return "UNKNOWN";
}
