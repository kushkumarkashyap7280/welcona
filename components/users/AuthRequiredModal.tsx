"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AuthRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthRequiredModal({ open, onOpenChange }: AuthRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            Please sign in or create an account before adding products to your cart.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button asChild variant="outline">
            <Link href="/signup">Create Account</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
