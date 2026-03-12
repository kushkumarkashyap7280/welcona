"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().min(2, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0),
  retailPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0),
  wholesaleMinQuantity: z.coerce.number().min(1),
  description: z.string().optional(),
  warranty: z.string().optional(),
  finish: z.string().optional(),
  material: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: any | null; // Product with relations
  categories: { id: string; name: string }[];
}

export function ProductFormDialog({
  open,
  onOpenChange,
  initialData,
  categories,
}: ProductFormDialogProps) {
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      quantity: 0,
      retailPrice: 0,
      wholesalePrice: 0,
      wholesaleMinQuantity: 5,
      description: "",
      warranty: "",
      finish: "",
      material: "",
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name,
        sku: initialData.sku,
        categoryId: initialData.categoryId,
        quantity: initialData.quantity,
        retailPrice: initialData.retailPrice,
        wholesalePrice: initialData.wholesalePrice,
        wholesaleMinQuantity: initialData.wholesaleMinQuantity,
        description: initialData.description || "",
        warranty: initialData.warranty || "",
        finish: initialData.finish || "",
        material: initialData.material || "",
      });
      setImages(initialData.images || []);
    } else if (!open) {
      form.reset();
      setImages([]);
    }
  }, [initialData, open, form]);

  const addImage = () => {
    if (!imageUrlInput) return;
    setImages([...images, imageUrlInput]);
    setImageUrlInput("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const payload = { ...data, images };

      if (initialData) {
        const res = await updateProductAction(initialData.id, payload);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Product updated");
          onOpenChange(false);
        }
      } else {
        const res = await createProductAction(payload);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Product created");
          onOpenChange(false);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Modify the product details below." 
              : "Add a new product to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...form.register("sku")} />
              {form.formState.errors.sku && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select 
                onValueChange={(val) => form.setValue("categoryId", val, { shouldValidate: true })} 
                value={form.watch("categoryId")}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Stock Quantity</Label>
              <Input id="quantity" type="number" {...form.register("quantity")} />
              {form.formState.errors.quantity && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retailPrice">Retail Price ($)</Label>
              <Input id="retailPrice" type="number" step="0.01" {...form.register("retailPrice")} />
              {form.formState.errors.retailPrice && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.retailPrice.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Wholesale Price ($)</Label>
              <Input id="wholesalePrice" type="number" step="0.01" {...form.register("wholesalePrice")} />
              {form.formState.errors.wholesalePrice && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.wholesalePrice.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wholesaleMinQuantity">Wholesale Min Qty</Label>
              <Input id="wholesaleMinQuantity" type="number" {...form.register("wholesaleMinQuantity")} />
              {form.formState.errors.wholesaleMinQuantity && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.wholesaleMinQuantity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warranty">Warranty</Label>
              <Input id="warranty" placeholder="e.g. 5 Years" {...form.register("warranty")} />
              {form.formState.errors.warranty && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.warranty.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="finish">Finish</Label>
              <Input id="finish" placeholder="e.g. Chrome" {...form.register("finish")} />
              {form.formState.errors.finish && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.finish.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input id="material" placeholder="e.g. Brass" {...form.register("material")} />
              {form.formState.errors.material && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.material.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" className="resize-none h-24" {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Images Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <Label className="text-base font-semibold">Images</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={imageUrlInput} 
                onChange={(e) => setImageUrlInput(e.target.value)} 
              />
              <Button type="button" onClick={addImage} variant="secondary">Add</Button>
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((img, idx) => (
                  <Badge key={idx} variant="outline" className="flex items-center gap-1 p-1 pr-2">
                    <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                      <img src={img} alt="" className="object-cover h-full w-full" />
                    </div>
                    <span className="text-xs truncate max-w-[150px]">{img}</span>
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500 ml-1" onClick={() => removeImage(idx)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
