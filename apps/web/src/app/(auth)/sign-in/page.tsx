"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/sign-in", { email, password });
      const data = response.data?.data;

      if (data?.user) {
        setAuth(data.user);
        // Redirect admin to admin panel, regular users to dashboard
        if (data.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Login failed: no user data received.");
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || "Tidak dapat masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="soft" className="w-full rounded-xl border border-border shadow-(--shadow-level-3) p-4">
      <CardHeader className="space-y-1 text-center pb-8">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
          D
        </div>
        <CardTitle className="display-md">Selamat datang kembali</CardTitle>
        <p className="body-sm text-muted-foreground">
          Masukkan email dan kata sandi untuk melanjutkan.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <Button type="submit" className="w-full rounded-full mt-4" disabled={loading}>
            {loading ? "Sedang masuk..." : "Masuk"}
          </Button>
        </form>
        <div className="mt-6 text-center body-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/sign-up" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors">
            Daftar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
