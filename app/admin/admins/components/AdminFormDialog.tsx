"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAdminAction } from "@/lib/actions/admins";

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

type AdminFormValues = z.infer<typeof formSchema>;

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminFormDialog({ open, onOpenChange }: AdminFormDialogProps) {
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      role: "ADMIN",
    },
  });

  const onSubmit = async (data: AdminFormValues) => {
    try {
      const payload = {
        ...data,
        password: data.password || undefined,
      };
      
      const res = await createAdminAction(payload);
      
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Administrator successfully added.");
        form.reset();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) form.reset();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Administrator</DialogTitle>
          <DialogDescription>
            Grant system access to a new team member. They will use their email to log in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName"
              disabled={form.formState.isSubmitting} 
              placeholder="e.g. Jane Doe" 
              {...form.register("fullName")} 
            />
            {form.formState.errors.fullName && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email" 
              disabled={form.formState.isSubmitting} 
              placeholder="jane@welcona.com" 
              {...form.register("email")} 
            />
            {form.formState.errors.email && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">System Role</Label>
            <Select 
              disabled={form.formState.isSubmitting} 
              onValueChange={(val) => form.setValue("role", val as any, { shouldValidate: true })} 
              value={form.watch("role")}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Standard Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.role.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Initial Password (Optional)</Label>
            <Input 
              id="password"
              type="password" 
              disabled={form.formState.isSubmitting} 
              placeholder="Leave blank for auto-generated" 
              {...form.register("password")} 
            />
            <p className="text-[0.8rem] mt-1 text-muted-foreground">
              If left blank, defaults to &apos;welcona2026!&apos;
            </p>
            {form.formState.errors.password && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="pt-4 flex justify-end space-x-2 border-t mt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              type="button"
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Grant Access
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
