"use client";

import { useAdminUsers, useUpdateUserStatus } from "@/hooks/use-admin";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { Users, Mail, Clock, MoreVertical, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminUser } from "@/types/admin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();
  const { mutate: updateStatus, isPending } = useUpdateUserStatus();

  if (isLoading) return <LoadingState text="Loading users..." />;

  const handleToggleStatus = (user: AdminUser) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    updateStatus({ id: user.id, status: newStatus });
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="size-6 text-primary" /> Manage Users
          </span>
        }
        description="View and manage all registered users in the system."
      />

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tracked Products</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: AdminUser) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{user.name}</span>
                      <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="size-3" /> {user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.role === "ADMIN" ? "default" : "outline"} className="text-[10px]">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{user.trackedProductsCount || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors outline-none cursor-pointer">
                        <MoreVertical className="size-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(user)}
                          disabled={isPending || user.role === "ADMIN"} // Prevent self-lock or locking other admins easily
                          className={user.status === "ACTIVE" ? "text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" : "cursor-pointer"}
                        >
                          {user.status === "ACTIVE" ? (
                            <><Ban className="size-4 mr-2" /> Suspend User</>
                          ) : (
                            <><CheckCircle className="size-4 mr-2" /> Activate User</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
