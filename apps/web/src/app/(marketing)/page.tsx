import Link from "next/link";
import { ArrowRight, BellRing, ChartNoAxesCombined, Check, Link2, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { icon: Link2, title: "Tempel tautan", description: "Salin URL produk dari marketplace yang didukung." },
  { icon: Search, title: "Atur target", description: "Periksa detail produk lalu tentukan harga incaranmu." },
  { icon: BellRing, title: "Tunggu kabar", description: "Kami memantau perubahan dan memberi tahu saat waktunya tepat." },
];

export default function MarketingPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-14 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-36">
        <div>
          <p className="mb-5 text-sm font-medium text-muted-foreground">Pemantau harga marketplace Indonesia</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">Harga berubah. Kamu nggak perlu cek terus.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Pantau produk incaran, lihat riwayat harganya, dan dapatkan kabar ketika harga menyentuh targetmu.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-xl px-6")} href="/sign-up">Mulai pantau gratis <ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link>
            <Link className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 rounded-xl px-6")} href="/pricing">Lihat paket</Link>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Check aria-hidden="true" className="size-4" /> Tidak perlu kartu pembayaran untuk memulai.</p>
        </div>

        <div aria-label="Contoh cara menambahkan produk" className="rounded-2xl border bg-card p-5 sm:p-7">
          <p className="text-sm font-medium">Produk apa yang ingin kamu pantau?</p>
          <div className="mt-3 flex min-h-12 items-center gap-3 rounded-xl border bg-background px-4 text-sm text-muted-foreground"><Link2 aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">https://www.tokopedia.com/toko/produk-incaran</span></div>
          <div className="mt-5 grid grid-cols-[72px_1fr] gap-4 border-t pt-5">
            <div className="aspect-square rounded-xl bg-muted" aria-hidden="true" />
            <div className="min-w-0"><div className="h-3 w-3/4 rounded bg-foreground/80" /><div className="mt-3 h-2.5 w-1/2 rounded bg-muted-foreground/30" /><p className="mt-4 font-semibold tabular-nums">Rp1.249.000</p><p className="mt-1 text-xs text-success">Turun Rp150.000 dalam 30 hari</p></div>
          </div>
          <svg className="mt-6 h-28 w-full" viewBox="0 0 420 112" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">Contoh grafik riwayat harga</title><desc id="chart-desc">Harga bergerak turun secara bertahap selama tiga puluh hari.</desc><path d="M4 24 C58 28 72 42 112 39 S170 35 205 57 S270 50 310 73 S368 68 416 91" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M4 104H416" stroke="currentColor" strokeOpacity=".12" /></svg>
        </div>
      </section>

      <section aria-labelledby="marketplace-title" className="border-y bg-card"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6"><h2 id="marketplace-title" className="text-sm font-medium text-muted-foreground">Marketplace yang didukung</h2><ul className="flex flex-wrap gap-2">{["Tokopedia", "Shopee", "Blibli"].map((name) => <li key={name} className="rounded-full border px-4 py-2 text-sm font-medium">{name}</li>)}</ul></div></section>

      <section id="cara-kerja" className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <p className="text-sm font-medium text-muted-foreground">Cara kerja</p><h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Tiga langkah, lalu biarkan Dipantauin bekerja.</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">{steps.map(({ icon: Icon, title, description }, index) => <article key={title} className="bg-card p-6 sm:p-8"><div className="flex items-center justify-between"><Icon aria-hidden="true" className="size-5" /><span className="text-sm tabular-nums text-muted-foreground">0{index + 1}</span></div><h3 className="mt-10 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>)}</div>
      </section>

      <section className="bg-foreground text-background"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28"><div><ChartNoAxesCombined aria-hidden="true" className="size-6" /><h2 className="mt-6 text-3xl font-bold tracking-tight">Keputusan belanja dengan konteks, bukan tebakan.</h2></div><p className="text-base leading-7 text-background/70">Bandingkan harga saat ini dengan riwayat sebelumnya dan tetapkan target agar notifikasi yang datang benar-benar berguna.</p></div></section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center md:py-28"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Siap berhenti mengecek harga berulang kali?</h2><p className="mx-auto mt-4 max-w-xl text-muted-foreground">Tambahkan produk pertamamu dan biarkan perubahan penting datang kepadamu.</p><Link className={cn(buttonVariants({ size: "lg" }), "mt-8 h-12 rounded-xl px-6")} href="/sign-up">Pantau produk pertama</Link></section>
    </main>
  );
}
