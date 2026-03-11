"use client";

import { useEffect, useState, useActionState, useTransition } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { getProfileAction, updateProfileAction } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";

type Profile = Awaited<ReturnType<typeof getProfileAction>>;

export default function DetailsPage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    getProfileAction().then((p) => {
      setProfile(p);
      setFullName(p?.fullName ?? "");
      setMobile(p?.mobile ?? "");
      setAvatarUrl(p?.avatarUrl ?? "");
      setLoadingProfile(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateProfileAction({ fullName, mobile, avatarUrl });
      setResult(res);
      if (res.success) {
        // re-fetch to show latest
        const updated = await getProfileAction();
        setProfile(updated);
      }
    });
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Account Details</h1>

      {loadingProfile ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-12 animate-pulse rounded-2xl border border-border/60 bg-muted/30"
            />
          ))}
        </div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="luxury-panel space-y-5 p-6 md:p-8"
        >
          {/* Avatar preview + URL input */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="size-16 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
                {(fullName || profile?.email || "U")[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <label className="block text-sm font-medium">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <label htmlFor="fullName" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Email – read-only */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">
              Email{" "}
              <span className="text-xs text-muted-foreground">(read-only)</span>
            </label>
            <input
              type="email"
              value={profile?.email ?? ""}
              readOnly
              className="w-full rounded-xl border border-border/50 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label htmlFor="mobile" className="block text-sm font-medium">
              Mobile
            </label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Feedback */}
          {result?.error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {result.error}
            </p>
          )}
          {result?.success && (
            <p className="flex items-center gap-2 rounded-xl border border-green-400/30 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="size-4" /> Profile updated successfully.
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl"
            size="lg"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </motion.form>
      )}
    </div>
  );
}
