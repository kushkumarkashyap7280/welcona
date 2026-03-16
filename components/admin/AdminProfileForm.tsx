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
import { updateAdminProfileAction } from "@/lib/actions/profile";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function AdminProfileForm({ initialData }: { initialData: { fullName: string; email: string } }) {
  const [isPending, setIsPending] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      email: initialData.email,
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsPending(true);
    try {
      const res = await updateAdminProfileAction({
        fullName: data.fullName,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile updated successfully!");
        form.reset({
          fullName: res.admin?.fullName || data.fullName,
          email: data.email,
        });
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Display Name</Label>
            <Input id="fullName" {...form.register("fullName")} disabled={isPending} />
            {form.formState.errors.fullName && <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register("email")} disabled className="bg-muted/50 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">The admin email address cannot be changed.</p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending || !form.formState.isDirty}>
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}
