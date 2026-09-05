import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductImage } from "@/components/products/product-image";
import type { TrackedProduct } from "@/types/product";
import { formatRupiah } from "@/lib/format";

interface RecentProductsProps {
  products: TrackedProduct[];
  isLoading: boolean;
}

export function RecentProducts({ products, isLoading }: RecentProductsProps) {
  const recentProducts = products.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Products</h2>
        <Link
          href="/dashboard/products"
          className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
        >
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Start tracking prices by adding your first product."
          action={{ label: "Add Product", href: "/dashboard/products" }}
        />
      ) : (
        <div className="grid gap-3">
          {recentProducts.map((up) => {
            const isAtTarget = up.targetPrice && up.product.currentPrice && up.product.currentPrice <= up.targetPrice;
            return (
              <Link
                key={up.id}
                href={`/dashboard/products/${up.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
              >
                <ProductImage src={up.product.imageUrl} alt={up.product.name || "Gambar produk"} width={40} height={40} sizes="40px" className="size-10 rounded-lg object-cover shrink-0 border" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {up.product.name || up.product.url}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {up.product.platform || "Unknown platform"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm">
                    {up.product.currentPrice
                      ? formatRupiah(up.product.currentPrice)
                      : "—"}
                  </p>
                  {isAtTarget ? (
                    <Badge className="text-[10px] mt-1" variant="default">🎯 Target Hit</Badge>
                  ) : up.targetPrice ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target: {formatRupiah(up.targetPrice)}
                    </p>
                  ) : null}
                </div>
                <Badge variant={up.isActive ? "secondary" : "outline"} className="shrink-0 text-xs">
                  {up.isActive ? "Active" : "Paused"}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
