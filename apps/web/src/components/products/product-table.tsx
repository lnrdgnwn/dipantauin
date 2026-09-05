import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { TrackedProduct } from "@/types/product";
import { formatRupiah } from "@/lib/format";
import { ProductImage } from "@/components/products/product-image";

export function ProductTable({ products, isLoading }: { products: TrackedProduct[]; isLoading: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Current Price</TableHead>
          <TableHead>Target Price</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              Loading products...
            </TableCell>
          </TableRow>
        ) : products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No products tracked yet.
            </TableCell>
          </TableRow>
        ) : (
          products.map((userProduct) => (
            <TableRow key={userProduct.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/products/${userProduct.id}`} className="flex min-w-48 items-center gap-3 hover:underline">
                  <ProductImage
                    src={userProduct.product.imageUrl}
                    alt={userProduct.product.name || "Gambar produk"}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="size-12 shrink-0 rounded-md border object-cover"
                  />
                  <span>{userProduct.product.name || "Unknown Product"}</span>
                </Link>
              </TableCell>
              <TableCell>
                <a
                  href={userProduct.product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline max-w-[200px] truncate block"
                >
                  {userProduct.product.url}
                </a>
              </TableCell>
              <TableCell>
                {userProduct.product.currentPrice
                  ? formatRupiah(userProduct.product.currentPrice)
                  : "-"}
              </TableCell>
              <TableCell>
                {userProduct.targetPrice
                  ? formatRupiah(userProduct.targetPrice)
                  : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={userProduct.isActive ? "default" : "secondary"}>
                  {userProduct.isActive ? "ACTIVE" : "PAUSED"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
