"use client";

import { CircleAlert, Clock3 } from "lucide-react";
import { useAdminPriceChecks } from "@/hooks/use-admin";
import type { AdminPriceCheck } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminPriceChecksPage() {
  const { data = [], isLoading, isError, refetch } = useAdminPriceChecks();
  if (isLoading) return <LoadingState text="Memuat kegagalan pemeriksaan..." />;
  if (isError) return <ErrorState title="Data pemeriksaan tidak dapat dimuat" onRetry={() => void refetch()} />;
  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-6"><PageHeader title={<span className="flex items-center gap-2"><CircleAlert className="size-6" /> Kegagalan pemeriksaan</span>} description="Diagnosis aman untuk pemeriksaan harga yang gagal. Pesan sensitif tidak ditampilkan." />
    <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-4">Produk</th><th className="px-5 py-4">Marketplace</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Mulai</th><th className="px-5 py-4">Durasi</th><th className="px-5 py-4">Ringkasan</th></tr></thead><tbody>{(data as AdminPriceCheck[]).map((check) => { const duration = check.completedAt ? Math.max(0, new Date(check.completedAt).getTime() - new Date(check.startedAt).getTime()) : null; return <tr key={check.id} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{check.product.name}</td><td className="px-5 py-4">{check.product.platform}</td><td className="px-5 py-4"><Badge variant="destructive">Gagal</Badge></td><td className="px-5 py-4 text-muted-foreground">{new Date(check.startedAt).toLocaleString("id-ID")}</td><td className="px-5 py-4 text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3" />{duration === null ? "—" : `${duration} ms`}</span></td><td className="max-w-xs truncate px-5 py-4 text-muted-foreground" title={check.errorMessage || "Tidak ada detail"}>{check.errorMessage || "Tidak ada detail"}</td></tr>; })}{data.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Tidak ada pemeriksaan gagal terbaru.</td></tr>}</tbody></table></div></div>
  </div>;
}
