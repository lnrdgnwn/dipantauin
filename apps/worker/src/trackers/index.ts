import { ProductTracker } from "./product-tracker";
import { TokopediaTracker } from "./tokopedia-tracker";
import { ShopeeTracker } from "./shopee-tracker";
import { BlibliTracker } from "./blibli-tracker";
export type { Marketplace, Availability, TrackedProduct } from "./product-tracker";
export { TrackerError } from "./product-tracker";

const trackers: ProductTracker[] = [
  new TokopediaTracker(),
  new ShopeeTracker(),
  new BlibliTracker(),
];

export function getTracker(url: string): ProductTracker {
  const tracker = trackers.find((t) => t.canHandle(url));
  
  if (!tracker) {
    throw new Error(`Unsupported platform for URL: ${url}`);
  }
  
  return tracker;
}
