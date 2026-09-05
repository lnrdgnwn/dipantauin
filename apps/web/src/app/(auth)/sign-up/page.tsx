"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/auth/sign-up", { name, email, password, confirmPassword });

      if (response.data?.success) {
        // Sign-up sends a verification email, so redirect to verify page or show success
        setSuccess("Account created! Please check your email for a verification code.");
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }, 2000);
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(message || "Tidak dapat membuat akun. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="soft" className="w-full rounded-xl border border-border shadow-[var(--shadow-level-3)] p-4">
      <CardHeader className="space-y-1 text-center pb-8">
        <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
          D
        </div>
        <CardTitle className="display-md">Create an account</CardTitle>
        <p className="body-sm text-muted-foreground">
          Enter your information to get started
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">{success}</div>
          )}
          <Button type="submit" className="w-full rounded-full mt-4" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <div className="mt-6 text-center body-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
