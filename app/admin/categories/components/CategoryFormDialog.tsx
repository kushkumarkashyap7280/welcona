"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCategoryAction, updateCategoryAction } from "@/lib/actions/categories";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(500).optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any | null; // using any temporarily to bypass strict Category type issues
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  initialData,
}: CategoryFormDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name,
        description: initialData.description || "",
      });
    } else if (!open) {
      form.reset({ name: "", description: "" });
    }
  }, [initialData, open, form]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (initialData) {
        const res = await updateCategoryAction(initialData.id, data);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Category updated");
          onOpenChange(false);
        }
      } else {
        const res = await createCategoryAction(data);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Category created");
          onOpenChange(false);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Category" : "Create Category"}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Make changes to the category details here." 
              : "Add a new product category to your store."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              disabled={form.formState.isSubmitting} 
              placeholder="e.g. Wash Basins" 
              {...form.register("name")} 
            />
            {form.formState.errors.name && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description"
              disabled={form.formState.isSubmitting} 
              placeholder="Brief description of the category..." 
              className="resize-none"
              rows={3}
              {...form.register("description")} 
            />
            {form.formState.errors.description && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          
          <div className="pt-4 flex justify-end space-x-2">
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
              {initialData ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
