"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-email", { email, code });
      const data = response.data?.data;

      if (data?.user) {
        setAuth(data.user);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || "Verifikasi email gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="soft" className="w-full rounded-xl border border-border shadow-[var(--shadow-level-3)] p-4">
      <CardHeader className="space-y-1 text-center pb-8">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
          ✉
        </div>
        <CardTitle className="display-md">Verify your email</CardTitle>
        <p className="body-sm text-muted-foreground">
          Enter the 6-digit code sent to <strong>{emailParam || "your email"}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          {!emailParam && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <Button type="submit" className="w-full rounded-full mt-4" disabled={loading || code.length !== 6}>
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
