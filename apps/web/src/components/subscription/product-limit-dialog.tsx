"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductLimitEvent = CustomEvent<{ limit: number }>;

export function ProductLimitDialog() {
  const router = useRouter();
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    const showDialog = (event: Event) => {
      const { limit: reachedLimit } = (event as ProductLimitEvent).detail;
      setLimit(reachedLimit);
    };

    window.addEventListener("dipantauin:product-limit-reached", showDialog);
    return () =>
      window.removeEventListener("dipantauin:product-limit-reached", showDialog);
  }, []);

  const viewPlans = () => {
    setLimit(null);
    router.push("/dashboard/subscription");
  };

  return (
    <Dialog open={limit !== null} onOpenChange={(open) => !open && setLimit(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Crown className="size-5" />
          </div>
          <DialogTitle>Batas produk tercapai</DialogTitle>
          <DialogDescription>
            Paketmu dapat memantau maksimal {limit ?? 0} produk aktif. Nonaktifkan
            salah satu produk atau pilih paket dengan kapasitas lebih besar untuk
            melanjutkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLimit(null)}>
            Nanti saja
          </Button>
          <Button onClick={viewPlans}>Lihat pilihan paket</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
