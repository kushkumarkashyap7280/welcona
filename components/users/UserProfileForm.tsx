"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfileAction } from "@/lib/actions/profile";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  mobile: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function UserProfileForm({ initialData }: { initialData: { fullName: string; email: string; mobile: string | null } }) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      email: initialData.email,
      mobile: initialData.mobile || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsPending(true);
    try {
      const res = await updateUserProfileAction({
        fullName: data.fullName,
        mobile: data.mobile || "",
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 luxury-panel p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...form.register("fullName")} disabled={isPending} />
          {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" {...form.register("email")} disabled className="bg-muted/50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Email addresses cannot be changed.</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="mobile">Phone Number</Label>
          <Input id="mobile" {...form.register("mobile")} disabled={isPending} />
           {form.formState.errors.mobile && <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isPending || !form.formState.isDirty}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
