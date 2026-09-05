"use client";

import { useAuthStore } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth";
import { useState } from "react";

export function ProfileTab() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setMessage("");
    try {
      setAuth(await authApi.updateProfile(name.trim()));
      setMessage("Profil berhasil diperbarui.");
    } catch {
      setMessage("Profil gagal diperbarui. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };
  return <Card><CardHeader><CardTitle>Profil</CardTitle><CardDescription>Informasi akun yang terhubung ke sesi saat ini.</CardDescription></CardHeader><CardContent className="space-y-6">
    <div className="flex items-center gap-4"><Avatar className="size-14"><AvatarFallback>{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback></Avatar><div><p className="font-medium">{user?.name || "Pengguna"}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-name">Nama</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} /></div><div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={user?.email || ""} disabled /></div></div>
    <div className="flex items-center gap-3"><Button onClick={() => void save()} disabled={saving || !name.trim() || name.trim() === (user?.name || "")}>{saving ? "Menyimpan..." : "Simpan profil"}</Button>{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}</div>
  </CardContent></Card>;
}
