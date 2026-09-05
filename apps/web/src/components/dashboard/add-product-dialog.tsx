"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { trackedProductsApi } from "@/lib/api/products";
import { formatRupiah } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { ProductPreview } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductImage } from "@/components/products/product-image";

type Step = "url" | "previewing" | "configure" | "saving";
const productUrlPattern =
  /^https:\/\/(?:[^/]+\.)?(tokopedia\.com|shopee\.co\.id|blibli\.com)\//i;

export function AddProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [preview, setPreview] = useState<ProductPreview | null>(null);
  const [notifyOnDrop, setNotifyOnDrop] = useState(true);
  const [notifyOnIncrease, setNotifyOnIncrease] = useState(false);
  const [error, setError] = useState("");

  const previewProduct = async () => {
    if (!productUrlPattern.test(url.trim())) {
      setError(
        "Gunakan tautan produk Tokopedia, Shopee, atau Blibli yang valid.",
      );
      return;
    }
    setError("");
    setStep("previewing");
    try {
      setPreview(await trackedProductsApi.preview(url.trim()));
      setStep("configure");
    } catch (reason: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(reason)
        ? reason.response?.data?.message
        : undefined;
      setError(message || "Preview produk gagal. Silakan coba lagi.");
      setStep("url");
    }
  };

  const addToWatchlist = async () => {
    const target = Number(targetPrice);
    if (!preview || !Number.isInteger(target) || target <= 0) {
      setError(
        "Masukkan target harga berupa angka Rupiah yang lebih besar dari nol.",
      );
      return;
    }
    setError("");
    setStep("saving");
    try {
      const tracked = await trackedProductsApi.track({
        url: preview.canonicalUrl,
        targetPrice: target,
        notifyOnDrop,
        notifyOnIncrease,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      onOpenChange(false);
      router.push(`/dashboard/products/${tracked.id}`);
    } catch (reason: unknown) {
      const response = axios.isAxiosError<{
        message?: string;
        code?: string;
      }>(reason)
        ? reason.response?.data
        : undefined;
      const message = response?.message;
      setError(
        response?.code === "PRODUCT_LIMIT_REACHED"
          ? ""
          : message || "Produk gagal ditambahkan. Silakan coba lagi.",
      );
      setStep("configure");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {(step === "url" || step === "previewing") && (
          <>
            <DialogHeader>
              <DialogTitle>Pantau produk</DialogTitle>
              <DialogDescription>
                Pilih marketplace lalu tempel tautan produk. Preview tidak
                langsung menambahkannya ke watchlist.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>Marketplace yang didukung</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["Tokopedia", "Shopee", "Blibli"].map((name) => (
                    <div
                      key={name}
                      className="rounded-lg border bg-muted/40 px-2 py-2 text-center text-xs font-medium"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-url">Tautan produk</Label>
                <Input
                  id="product-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://..."
                  value={url}
                  disabled={step === "previewing"}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && void previewProduct()
                  }
                  aria-describedby="product-url-hint"
                />
                <p
                  id="product-url-hint"
                  className="text-xs text-muted-foreground"
                >
                  Gunakan halaman detail produk, bukan halaman pencarian.
                </p>
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button
                onClick={previewProduct}
                disabled={!url.trim() || step === "previewing"}
              >
                {step === "previewing" ? (
                  <>
                    <Loader2 className="animate-spin" /> Mengambil preview...
                  </>
                ) : (
                  <>
                    <Search /> Lihat preview
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {(step === "configure" || step === "saving") && preview && (
          <>
            <DialogHeader>
              <DialogTitle>Atur watchlist</DialogTitle>
              <DialogDescription>
                Preview diambil pada waktu{" "}
                {new Intl.DateTimeFormat("id-ID", {
                  timeStyle: "short",
                }).format(new Date(preview.fetchedAt))}
                . Konfirmasi setelah target sesuai.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="flex gap-4 rounded-xl border p-4">
                <ProductImage
                  src={preview.imageUrl}
                  alt={preview.name || "Gambar produk"}
                  width={80}
                  height={80}
                  sizes="80px"
                  className="size-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{preview.marketplace}</Badge>
                    <Badge
                      variant={
                        preview.availability === "UNAVAILABLE"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {preview.availability === "AVAILABLE"
                        ? "Tersedia"
                        : preview.availability === "UNAVAILABLE"
                          ? "Tidak tersedia"
                          : "Status belum diketahui"}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold">
                    {preview.name}
                  </p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatRupiah(preview.currentPrice)}
                  </p>
                  {preview.originalPrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatRupiah(preview.originalPrice)}
                    </p>
                  )}
                  <a
                    href={preview.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs underline underline-offset-4"
                  >
                    Buka marketplace <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-price">Target harga</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="target-price"
                    className="pl-9 tabular-nums"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={targetPrice}
                    onChange={(event) => setTargetPrice(event.target.value)}
                  />
                </div>
                {targetPrice && (
                  <p className="text-xs text-muted-foreground">
                    Target: {formatRupiah(targetPrice)}
                  </p>
                )}
              </div>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Notifikasi</legend>
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={notifyOnDrop}
                    onChange={(e) => setNotifyOnDrop(e.target.checked)}
                  />{" "}
                  Harga turun atau target tercapai
                </label>
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={notifyOnIncrease}
                    onChange={(e) => setNotifyOnIncrease(e.target.checked)}
                  />{" "}
                  Harga naik
                </label>
              </fieldset>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={step === "saving"}
                onClick={() => setStep("url")}
              >
                Kembali
              </Button>
              <Button
                disabled={step === "saving" || !targetPrice}
                onClick={addToWatchlist}
              >
                {step === "saving" ? (
                  <>
                    <Loader2 className="animate-spin" /> Menambahkan...
                  </>
                ) : (
                  "Add to Watchlist"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
