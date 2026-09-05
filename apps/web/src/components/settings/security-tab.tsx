"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/use-auth";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { LogOut, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

export function SecurityTab() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await authApi.signOut();
    } finally {
      logout();
      router.replace("/sign-in");
      router.refresh();
    }
  };

  const handlePasswordUpdate = async () => {
    if (isUpdating || newPw !== confirmPw) return;
    setIsUpdating(true);
    setMessage("");
    try {
      await authApi.changePassword(currentPw, newPw, confirmPw);
      logout();
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setMessage("Password gagal diperbarui. Periksa password saat ini.");
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a strong password to secure your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
          <Button className="rounded-full" onClick={() => void handlePasswordUpdate()} disabled={isUpdating || !currentPw || newPw.length < 8 || newPw !== confirmPw}>
            {isUpdating ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="size-4" /> Danger Zone
          </CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm">Sign out of all devices</p>
              <p className="text-xs text-muted-foreground">Log out from the current session.</p>
            </div>
            <Button variant="outline" className="rounded-full" onClick={handleLogout} disabled={isSigningOut}>
              <LogOut className="mr-2 size-4" /> {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="font-medium text-sm text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all data.</p>
            </div>
            <Button variant="destructive" className="rounded-full" disabled>
              <Trash2 className="mr-2 size-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
