import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { BlibliTracker } from "./blibli-tracker";
import { extractStructuredProduct, isValidHttpUrl } from "./product-tracker";
import { ShopeeTracker } from "./shopee-tracker";
import { TokopediaTracker } from "./tokopedia-tracker";

const fixture = (name: string) => readFileSync(join(__dirname, "fixtures", `${name}.html`), "utf8");

test("Tokopedia accepts only its hostname and parses its fixture", () => {
  const tracker = new TokopediaTracker(); const parsed = extractStructuredProduct(fixture("tokopedia"));
  expect(tracker.canHandle("https://www.tokopedia.com/demo/produk")).toBe(true);
  expect(tracker.canHandle("https://tokopedia.com.evil.test/demo")).toBe(false);
  expect(parsed.price).toBe(33000); expect(parsed.originalPrice).toBe(45000);
});

test("Shopee normalizes a fixture into integer Rupiah metadata", () => {
  const tracker = new ShopeeTracker(); const parsed = extractStructuredProduct(fixture("shopee"));
  expect(tracker.canHandle("https://shopee.co.id/produk-i.12.34")).toBe(true);
  expect(parsed.name).toBe("Produk Shopee"); expect(parsed.price).toBe(1250000);
});

test("Blibli fixture preserves unavailable state", () => {
  const tracker = new BlibliTracker(); const parsed = extractStructuredProduct(fixture("blibli"));
  expect(tracker.canHandle("https://www.blibli.com/p/produk/ps--DEM-1")).toBe(true);
  expect(parsed.externalProductId).toBe("BLB-1"); expect(parsed.availability).toBe("UNAVAILABLE");
});

test("image refresh accepts only non-empty HTTP URLs", () => {
  expect(isValidHttpUrl("https://images.tokopedia.net/example.jpg")).toBe(true);
  expect(isValidHttpUrl("http://example.test/image.jpg")).toBe(true);
  expect(isValidHttpUrl("")).toBe(false);
  expect(isValidHttpUrl("/images/product-placeholder.svg")).toBe(false);
  expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  expect(isValidHttpUrl(null)).toBe(false);
});
