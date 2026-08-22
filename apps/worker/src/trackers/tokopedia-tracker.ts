import * as cheerio from "cheerio";
import { ProductTracker, TrackedProduct } from "./product-tracker";

export class TokopediaTracker implements ProductTracker {
  canHandle(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes("tokopedia.com");
    } catch {
      return false;
    }
  }

  async fetchProduct(url: string): Promise<TrackedProduct> {
    try {
      // Simulate real browser headers
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0"
      };

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Tokopedia typically puts product name in h1 with specific data-testids
      let name = $('h1[data-testid="lblPDPDetailProductName"]').text().trim();
      
      // Fallback to og:title
      if (!name) {
         name = $('meta[property="og:title"]').attr('content') || "";
         // clean up "Jual {Name}..."
         name = name.replace(/^Jual\s+/i, '').split(' - ')[0]; 
      }

      // Try to get canonical URL from meta tag
      const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;

      // Try to get shop name (sellerName)
      let sellerName = $('a[data-testid="llbPDPFooterShopName"]').text().trim();
      if (!sellerName) {
        // another common selector
        sellerName = $('h2[data-testid="llbPDPFooterShopName"]').text().trim() || 
                     $('.prd_link-shop-name').text().trim() ||
                     $('meta[property="og:site_name"]').attr('content')?.trim();
      }

      // Price extraction
      const priceText = $('div[data-testid="lblPDPDetailProductPrice"]').text().trim();
      
      if (!name) {
        throw new Error("Product name not found on page.");
      }
      
      if (!priceText) {
        throw new Error("Product price not found on page (might be JS rendered or blocked).");
      }

      // Parse price, e.g. "Rp 150.000" -> 150000
      const price = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
      
      if (isNaN(price)) {
         throw new Error(`Malformed price detected: ${priceText}`);
      }

      return {
        name,
        price,
        currency: "IDR",
        sellerName,
        canonicalUrl
      };
    } catch (error: any) {
      console.error(`[TokopediaTracker] Error fetching product from ${url}:`, error.message);
      throw error;
    }
  }
}
