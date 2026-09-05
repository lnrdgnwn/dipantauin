"use client";

import {
  useProduct,
  useUpdateProduct,
  useUntrackProduct,
  useCheckProductNow,
} from "@/hooks/use-products";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Trash2,
  Pause,
  Play,
  ExternalLink,
  TrendingDown,
  Target,
  Calendar,
  Edit2,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/products/product-image";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PriceHistory } from "@/types/product";
import { useState } from "react";
import { formatDateTime, formatRupiah } from "@/lib/format";

function PriceHistoryChart({ productId }: { productId: string }) {
  const { data: history, isLoading } = useQuery<PriceHistory[]>({
    queryKey: ["price-history", productId],
    queryFn: () =>
      api
        .get(`/products/${productId}/price-history?limit=30`)
        .then((r) => r.data.data.items),
  });

  if (isLoading) return <LoadingState text="Loading price history..." />;
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No price history yet. Data is collected on each check interval.
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-40">
        {history.slice(-30).map((h) => {
          const height = ((h.price - min) / range) * 100;
          return (
            <div
              key={h.id}
              className="group relative flex-1 flex flex-col justify-end"
              title={formatRupiah(h.price)}
            >
              <div
                className="rounded-t bg-primary/60 group-hover:bg-primary transition-colors"
                style={{ height: `${Math.max(height, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Terendah: {formatRupiah(min)}</span>
        <span>Tertinggi: {formatRupiah(max)}</span>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const {
    data: userProduct,
    isLoading,
    isError,
    refetch,
  } = useProduct(productId);
  const { mutate: update, isPending: updating } = useUpdateProduct();
  const { mutate: untrack, isPending: untracking } = useUntrackProduct();
  const {
    mutate: checkNow,
    isPending: queueingCheck,
    isSuccess: checkQueued,
    isError: checkFailed,
  } = useCheckProductNow();

  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState("");

  if (isLoading) return <LoadingState text="Loading product details..." />;
  if (isError || !userProduct) return <ErrorState onRetry={refetch} />;

  const { product } = userProduct;

  const handleToggle = () => {
    update({
      id: userProduct.id,
      payload: { isActive: !userProduct.isActive },
    });
  };

  const handleDelete = () => {
    if (!confirm("Stop tracking this product?")) return;
    untrack(userProduct.id, {
      onSuccess: () => router.push("/dashboard/products"),
    });
  };

  const handleSaveTarget = () => {
    const val = Number(targetInput);
    if (Number.isInteger(val) && val > 0) {
      update({ id: userProduct.id, payload: { targetPrice: val } });
    }
    setEditingTarget(false);
  };

  const priceDropPercent =
    userProduct.targetPrice && product.currentPrice
      ? Math.round(
          ((product.currentPrice - userProduct.targetPrice) /
            product.currentPrice) *
            100,
        )
      : null;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center justify-center size-9 rounded-full border border-border bg-background hover:bg-muted transition-colors shrink-0 mt-1"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="display-sm truncate">
              {product.name || "Product Detail"}
            </h1>
            <Badge variant={userProduct.isActive ? "default" : "secondary"}>
              {userProduct.isActive ? "ACTIVE" : "PAUSED"}
            </Badge>
          </div>
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm text-primary hover:underline mt-1 gap-1"
          >
            {product.platform || "View on store"}{" "}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {process.env.NODE_ENV !== "production" && (
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() =>
                checkNow(userProduct.id, {
                  onSuccess: () => router.push("/dashboard/notifications"),
                })
              }
              disabled={queueingCheck || !userProduct.isActive}
              title="Testing only: runs on the worker's next one-minute cycle"
            >
              <RefreshCw
                className={`mr-2 size-4 ${queueingCheck ? "animate-spin" : ""}`}
              />
              {queueingCheck
                ? "Queueing..."
                : checkQueued
                  ? "Notifikasi dibuat"
                  : checkFailed
                    ? "Gagal — cek pengaturan"
                  : "Check price now (test)"}
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleToggle}
            disabled={updating}
          >
            {userProduct.isActive ? (
              <>
                <Pause className="mr-2 size-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" /> Resume
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={handleDelete}
            disabled={untracking}
          >
            <Trash2 className="mr-2 size-4" /> Remove
          </Button>
        </div>
      </div>
      {/* Product Image + Stats */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Product Image */}
        <Card className="md:col-span-1 overflow-hidden">
          <ProductImage
            src={product.imageUrl}
            alt={product.name ?? "Product"}
            width={360}
            height={360}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="aspect-square h-full w-full object-cover"
          />
        </Card>

        {/* Current Price */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="caption-mono text-xs uppercase text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="size-3.5" /> Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatRupiah(product.currentPrice)}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="size-3" />
              {product.lastCheckedAt
                ? `Diperiksa ${formatDateTime(product.lastCheckedAt)}`
                : "Not checked yet"}
            </p>
          </CardContent>
        </Card>

        {/* Target Price */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="caption-mono text-xs uppercase text-muted-foreground flex items-center gap-1.5">
              <Target className="size-3.5" /> Target Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingTarget ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="e.g. 150000"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <Button
                  size="icon"
                  className="size-9 shrink-0 rounded-full"
                  onClick={handleSaveTarget}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 shrink-0 rounded-full"
                  onClick={() => setEditingTarget(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">
                    {formatRupiah(userProduct.targetPrice)}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-full"
                    onClick={() => {
                      setTargetInput(String(userProduct.targetPrice ?? ""));
                      setEditingTarget(true);
                    }}
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {priceDropPercent !== null && priceDropPercent > 0
                    ? `Needs ${priceDropPercent}% drop to hit target`
                    : priceDropPercent !== null && priceDropPercent <= 0
                      ? "Set a Target to be notified"
                      : "🎉 Target already reached"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceHistoryChart productId={product.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={userProduct.notifyOnDrop}
              disabled={updating}
              onChange={(event) =>
                update({
                  id: userProduct.id,
                  payload: { notifyOnDrop: event.target.checked },
                })
              }
            />{" "}
            Harga turun dan target tercapai
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={userProduct.notifyOnIncrease}
              disabled={updating}
              onChange={(event) =>
                update({
                  id: userProduct.id,
                  payload: { notifyOnIncrease: event.target.checked },
                })
              }
            />{" "}
            Harga naik
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
