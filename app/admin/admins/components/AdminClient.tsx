"use client";

import { useState } from "react";
import { Plus, Trash, Shield, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { deleteAdminAction } from "@/lib/actions/admins";
import { AdminFormDialog } from "./AdminFormDialog";
import { Badge } from "@/components/ui/badge";

interface AdminClientProps {
  data: any[];
  isSuperAdmin: boolean;
  currentUserId: string;
}

export function AdminClient({ data, isSuperAdmin, currentUserId }: AdminClientProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = async (id: string, email: string) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admins can delete administrative users.");
      return;
    }
    
    if (id === currentUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;

    const res = await deleteAdminAction(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Administrator removed successfully.");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administrators</h2>
          <p className="text-muted-foreground mt-2">
            Manage system administrators and their roles.
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Admin
          </Button>
        )}
      </div>

      <Card className="mt-8">
        <CardHeader className="py-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Active Administrators
          </CardTitle>
          <CardDescription>
            {isSuperAdmin 
              ? "You have full access to manage roles and capabilities." 
              : "You can view the list of administrators but cannot make changes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-75 py-4">Admin Detail</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>System Access Date</TableHead>
                <TableHead className="text-right py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="font-medium text-base">{admin.fullName || "System Admin"}</div>
                    <div className="text-sm text-muted-foreground">{admin.email}</div>
                  </TableCell>
                  <TableCell>
                    {admin.role === "SUPER_ADMIN" ? (
                      <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">
                        <Shield className="w-3 h-3 mr-1" /> Super Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {isSuperAdmin && admin.id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(admin.id, admin.email)}
                        className="hover:bg-red-100 hover:text-red-600"
                        title="Revoke Access"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <AdminFormDialog 
          open={open} 
          onOpenChange={setOpen} 
        />
      )}
    </>
  );
}
