"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SiteShell } from "@/components/users/SiteShell";
import { Button } from "@/components/ui/button";
import {
  sendOtpAction,
  verifyOtpAction,
  completeSignupAction,
} from "@/lib/actions/auth";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  User,
} from "lucide-react";
import {
  InputOTP,
  InputOTPSlot,
  InputOTPGroup,
} from "@/components/ui/input-otp";

type Step = "choose" | "email" | "verify" | "profile";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

// Google Icon SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Step indicator
function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "email", label: "Email", icon: <Mail className="size-3.5" /> },
    { key: "verify", label: "Verify", icon: <KeyRound className="size-3.5" /> },
    {
      key: "profile",
      label: "Profile",
      icon: <User className="size-3.5" />,
    },
  ];

  if (step === "choose") return null;

  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div
                className={`h-px w-8 transition-colors ${
                  isDone ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                s.icon
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function SignupClient() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("choose");
  const [direction, setDirection] = React.useState(1);
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  function goTo(next: Step) {
    const order: Step[] = ["choose", "email", "verify", "profile"];
    const dir = order.indexOf(next) > order.indexOf(step) ? 1 : -1;
    setDirection(dir);
    setError(null);
    setSuccess(null);
    setStep(next);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await sendOtpAction(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Verification code sent to your email!");
      goTo("verify");
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await verifyOtpAction(email, otp);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Email verified successfully!");
      goTo("profile");
    }
  }

  async function handleCompleteSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await completeSignupAction({
        email,
        fullName,
        password,
      });
      // If redirect happens, we won't reach here
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      // redirect throws NEXT_REDIRECT, which is expected
      router.push("/dashboard");
    }
  }

  async function handleResendOtp() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await sendOtpAction(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("New verification code sent!");
    }
  }

  return (
    <SiteShell>
      <section className="flex min-h-[80vh] items-center justify-center px-5 py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          <div className="luxury-panel p-8 md:p-10">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Create Account
            </p>
            <h1 className="mt-3 text-2xl font-semibold">Join Welcona</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Premium bath fittings, delivered to your door.
            </p>

            <div className="mt-6">
              <StepIndicator step={step} />

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {/* ── Step: Choose Method ──────────────── */}
                  {step === "choose" && (
                    <div className="space-y-4">
                      <a
                        href="/api/auth/google"
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition hover:bg-muted hover:border-border/90"
                      >
                        <GoogleIcon className="size-5" />
                        Continue with Google
                      </a>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-card px-3 text-muted-foreground">
                            or
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => goTo("email")}
                        variant="outline"
                        size="lg"
                        className="w-full rounded-xl gap-2"
                      >
                        <Mail className="size-4" />
                        Sign up with Email
                      </Button>
                    </div>
                  )}

                  {/* ── Step: Enter Email ────────────────── */}
                  {step === "email" && (
                    <form onSubmit={handleSendOtp} className="space-y-5">
                      <div className="space-y-2">
                        <label
                          htmlFor="signup-email"
                          className="block text-sm font-medium"
                        >
                          Email address
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        We&apos;ll send a 6-digit verification code to this
                        email.
                      </p>

                      {error && (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                          {error}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          className="rounded-xl"
                          onClick={() => goTo("choose")}
                        >
                          <ArrowLeft className="size-4 mr-1" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading}
                          size="lg"
                          className="flex-1 rounded-xl"
                        >
                          {loading ? (
                            <Loader2 className="size-4 animate-spin mr-2" />
                          ) : (
                            <ArrowRight className="size-4 mr-2" />
                          )}
                          {loading ? "Sending…" : "Send Code"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* ── Step: Verify OTP ─────────────────── */}
                  {step === "verify" && (
                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                        <ShieldCheck className="size-4 shrink-0" />
                        Code sent to{" "}
                        <span className="font-medium">{email}</span>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="otp-code"
                          className="block text-sm font-medium"
                        >
                          Verification Code
                        </label>
                        <InputOTP
                          id="otp-code"
                          maxLength={6}
                          value={otp}
                          onChange={(value) => setOtp(value)}
                          disabled={loading}
                          render={({ slots }) => (
                            <InputOTPGroup className="w-full justify-between gap-2">
                              {slots.map((slot, index) => (
                                <InputOTPSlot
                                  key={index}
                                  {...slot}
                                  index={index}
                                  className="h-14 w-full rounded-xl border border-border bg-background text-lg font-mono transition-all aria-invalid:border-destructive data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/30"
                                />
                              ))}
                            </InputOTPGroup>
                          )}
                        />
                      </div>

                      {success && (
                        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
                          {success}
                        </p>
                      )}
                      {error && (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                          {error}
                        </p>
                      )}

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="lg"
                          className="rounded-xl"
                          onClick={() => goTo("email")}
                        >
                          <ArrowLeft className="size-4 mr-1" />
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={loading || otp.length < 6}
                          size="lg"
                          className="flex-1 rounded-xl"
                        >
                          {loading ? (
                            <Loader2 className="size-4 animate-spin mr-2" />
                          ) : (
                            <ShieldCheck className="size-4 mr-2" />
                          )}
                          {loading ? "Verifying…" : "Verify"}
                        </Button>
                      </div>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        Didn&apos;t receive a code? Resend
                      </button>
                    </form>
                  )}

                  {/* ── Step: Complete Profile ───────────── */}
                  {step === "profile" && (
                    <form
                      onSubmit={handleCompleteSignup}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span className="font-medium">{email}</span> verified
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="fullname"
                          className="block text-sm font-medium"
                        >
                          Full Name
                        </label>
                        <input
                          id="fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium"
                        >
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="confirm-password"
                          className="block text-sm font-medium"
                        >
                          Confirm Password
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none ring-0 transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      {error && (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        size="lg"
                        className="w-full rounded-xl"
                      >
                        {loading ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="size-4 mr-2" />
                        )}
                        {loading ? "Creating account…" : "Create Account"}
                      </Button>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </section>
    </SiteShell>
  );
}
