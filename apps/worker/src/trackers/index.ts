import { ProductTracker } from "./product-tracker";
import { TokopediaTracker } from "./tokopedia-tracker";

const trackers: ProductTracker[] = [
  new TokopediaTracker(),
  // Add new trackers here
];

export function getTracker(url: string): ProductTracker {
  const tracker = trackers.find((t) => t.canHandle(url));
  
  if (!tracker) {
    throw new Error(`Unsupported platform for URL: ${url}`);
  }
  
  return tracker;
}
