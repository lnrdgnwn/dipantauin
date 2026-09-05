import { expect, test } from "vitest";
import { buildPriceChangeNotification } from "./product-checker";

const tracking = {
  id: "tracking-1",
  userId: "user-1",
  targetPrice: 90_000,
  notifyOnDrop: true,
  notifyOnIncrease: true,
};

test("target crossing has priority over a regular price drop", () => {
  const notification = buildPriceChangeNotification(
    tracking,
    "Produk Test",
    100_000,
    90_000,
  );

  expect(notification?.type).toBe("TARGET_REACHED");
});

test("price drop follows notifyOnDrop", () => {
  const notification = buildPriceChangeNotification(
    { ...tracking, targetPrice: null, notifyOnIncrease: false },
    "Produk Test",
    100_000,
    95_000,
  );

  expect(notification?.type).toBe("PRICE_DROP");
});

test("price increase follows notifyOnIncrease", () => {
  const notification = buildPriceChangeNotification(
    { ...tracking, notifyOnDrop: false },
    "Produk Test",
    100_000,
    105_000,
  );

  expect(notification?.type).toBe("PRICE_INCREASE");
});

test("unchanged prices and disabled settings do not create notifications", () => {
  expect(
    buildPriceChangeNotification(tracking, "Produk Test", 100_000, 100_000),
  ).toBeNull();
  expect(
    buildPriceChangeNotification(
      { ...tracking, notifyOnDrop: false, notifyOnIncrease: false },
      "Produk Test",
      100_000,
      90_000,
    ),
  ).toBeNull();
});
