const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? rupiah.format(numeric).replace(/\s/g, "") : "—";
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Belum diperiksa";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
