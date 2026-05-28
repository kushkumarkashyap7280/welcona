"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { adminLoginAction } from "@/lib/actions/admin-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export function AdminLoginModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenRequest = () => {
      setOpen(true);
    };

    window.addEventListener("welcona:open-admin-login", handleOpenRequest);
    return () => window.removeEventListener("welcona:open-admin-login", handleOpenRequest);
  }, []);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const res = await adminLoginAction(values.email, values.password);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      
      toast.success("Login successful!");
      setOpen(false);
      
      setTimeout(() => {
        loginForm.reset();
        router.push("/admin");
        router.refresh();
      }, 500);
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        loginForm.reset();
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Configuration</DialogTitle>
          <DialogDescription>
            Authenticate using email and password to access the administrative panel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              placeholder="admin@welcona.com" 
              type="email" 
              {...loginForm.register("email")} 
            />
            {loginForm.formState.errors.email && (
              <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              placeholder="••••••••" 
              type="password" 
              {...loginForm.register("password")} 
            />
            {loginForm.formState.errors.password && (
              <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.password.message}</p>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loginForm.formState.isSubmitting}
          >
            {loginForm.formState.isSubmitting && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Log In as Admin
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
