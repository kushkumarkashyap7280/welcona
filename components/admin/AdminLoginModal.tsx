"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { adminLoginStartAction, adminLoginVerifyAction } from "@/lib/actions/admin-auth";
import { adminForgotPasswordAction, adminVerifyResetOtpAction, adminResetPasswordAction } from "@/lib/actions/password-reset";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

export function AdminLoginModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"login" | "otp" | "forgot-email" | "forgot-otp" | "forgot-reset">("login");
  const [email, setEmail] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
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

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const res = await adminLoginStartAction(values.email, values.password);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setEmail(values.email);
      setStep("otp");
      toast.success("Verification code sent to your email.");
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  }

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    try {
      const res = await adminLoginVerifyAction(email, values.otp);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Login successful!");
      setOpen(false);
      
      setTimeout(() => {
        setStep("login");
        loginForm.reset();
        otpForm.reset();
        router.push("/admin");
      }, 500);
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  }

  // --- Password Reset Handlers ---
  async function onForgotEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your admin email");
      return;
    }
    try {
      const res = await adminForgotPasswordAction(resetEmail);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Verification code sent if email exists.");
      setStep("forgot-otp");
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  async function onForgotOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await adminVerifyResetOtpAction(resetEmail, otpForm.getValues().otp);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Code verified. Enter new password.");
      setStep("forgot-reset");
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  async function onForgotResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      const res = await adminResetPasswordAction(resetEmail, otpForm.getValues().otp, resetPassword);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Password reset successfully. Please login.");
      setStep("login");
      otpForm.reset();
      setResetEmail("");
      setResetPassword("");
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setStep("login");
        loginForm.reset();
        otpForm.reset();
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Configuration</DialogTitle>
          <DialogDescription>
            {step === "login" && "Authenticate to access the administrative panel."}
            {step === "otp" && "Enter the verification code sent to your email."}
            {step === "forgot-email" && "Enter your admin email to receive a recovery code."}
            {step === "forgot-otp" && "Enter the recovery code sent to your email."}
            {step === "forgot-reset" && "Create a new password for your admin account."}
          </DialogDescription>
        </DialogHeader>

        {step === "login" ? (
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button 
                    type="button" 
                    onClick={() => { setStep("forgot-email"); setResetEmail(loginForm.getValues().email); }} 
                    className="text-xs text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </button>
                </div>
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
                Verify Credentials
              </Button>
            </form>
        ) : step === "otp" ? (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <InputOTP 
                  maxLength={6} 
                  value={otpForm.watch("otp")}
                  onChange={(val) => otpForm.setValue("otp", val, { shouldValidate: true })}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {otpForm.formState.errors.otp && (
                  <p className="text-sm font-medium text-destructive">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={otpForm.formState.isSubmitting}
              >
                {otpForm.formState.isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Verify Code
              </Button>
            </form>
        ) : step === "forgot-email" ? (
            <form onSubmit={onForgotEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Admin Email</Label>
                <Input 
                  id="reset-email"
                  placeholder="admin@welcona.com" 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send Recovery Code
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("login")}>
                Back to Login
              </Button>
            </form>
        ) : step === "forgot-otp" ? (
            <form onSubmit={onForgotOtpSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <InputOTP 
                  maxLength={6} 
                  value={otpForm.watch("otp")}
                  onChange={(val) => otpForm.setValue("otp", val, { shouldValidate: true })}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {otpForm.formState.errors.otp && (
                  <p className="text-sm font-medium text-destructive">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={otpForm.formState.isSubmitting}>
                {otpForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify Code
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("forgot-email")}>
                Back
              </Button>
            </form>
        ) : step === "forgot-reset" ? (
            <form onSubmit={onForgotResetSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-admin-password">New Password</Label>
                <Input 
                  id="new-admin-password"
                  placeholder="••••••••" 
                  type="password" 
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
