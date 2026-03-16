"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleUserBlockStatus } from "@/lib/actions/admin-users";

export function ToggleUserBlockButton({ userId, currentlyBlocked }: { userId: string, currentlyBlocked: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setIsLoading(true);
    try {
      const res = await toggleUserBlockStatus(userId, currentlyBlocked);
      if (res.success) {
        toast.success(res.blocked ? "User has been blocked." : "User has been unblocked.");
        router.refresh();
      }
    } catch (e) {
      toast.error("Failed to update user status.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      variant={currentlyBlocked ? "outline" : "destructive"}
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : currentlyBlocked ? (
        <ShieldCheck className="h-4 w-4" />
      ) : (
        <ShieldAlert className="h-4 w-4" />
      )}
      {currentlyBlocked ? "Unblock User" : "Block User"}
    </Button>
  );
}
