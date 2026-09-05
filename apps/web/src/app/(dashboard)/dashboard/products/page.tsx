"use client";

import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { AddProductDialog } from "@/components/dashboard/add-product-dialog";
import { ProductTable } from "@/components/products/product-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/use-products";

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading, isError, refetch } = useProducts();
  const filtered = products.filter((tracking) =>
    (tracking.product.name || tracking.product.url)
      .toLocaleLowerCase("id-ID")
      .includes(search.toLocaleLowerCase("id-ID")),
  );

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col gap-6">
      <PageHeader
        title="Produk"
        description="Kelola produk dan target harga dalam watchlist."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus /> Pantau produk
        </Button>
      </PageHeader>
      {products.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            type="search"
            placeholder="Cari produk..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
      {isLoading ? (
        <LoadingState text="Memuat watchlist..." />
      ) : isError ? (
        <ErrorState
          title="Watchlist tidak dapat dimuat"
          description="Periksa koneksi lalu coba lagi."
          onRetry={() => void refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada produk"
          description="Tambahkan produk pertama untuk mulai memantau perubahan harga."
          action={{ label: "Pantau produk", onClick: () => setOpen(true) }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Produk tidak ditemukan"
          description={`Tidak ada hasil untuk “${search}”.`}
        />
      ) : (
        <ProductTable products={filtered} isLoading={false} />
      )}
      <AddProductDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
