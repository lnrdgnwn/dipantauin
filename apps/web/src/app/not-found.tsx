import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-8xl font-black text-muted-foreground/30 select-none">404</p>
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 gap-1.5 px-4 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-10 gap-1.5 px-4 text-sm font-medium rounded-full border border-border bg-background hover:bg-muted transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
