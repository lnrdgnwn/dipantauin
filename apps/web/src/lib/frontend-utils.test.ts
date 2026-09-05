import { expect, test } from "vitest";
import { formatRupiah } from "./format";

test("formatRupiah uses Indonesian separators without fractional digits", () => {
  expect(formatRupiah(33000)).toBe("Rp33.000");
  expect(formatRupiah("1250000")).toBe("Rp1.250.000");
  expect(formatRupiah(null)).toBe("—");
});
