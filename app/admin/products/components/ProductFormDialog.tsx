"use client";

import { useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Plus, Star, Upload, X } from "lucide-react";

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
import { normalizeImageSrc } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().min(2, "SKU is required"),
  categoryId: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0),
  retailPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0),
  wholesaleMinQuantity: z.coerce.number().min(1),
  discount: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0).max(100).optional()
  ),
  description: z.string().optional(),
  warranty: z.string().optional(),
  finish: z.string().optional(),
  material: z.string().optional(),
  tags: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;
type ProductImageField = {
  image: string;
  detail: string;
  isPrimary: boolean;
};

type ProductFormInitialData = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  quantity: number;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQuantity: number;
  discount: number | null;
  description: string | null;
  warranty: string | null;
  finish: string | null;
  material: string | null;
  tags: string[];
  images: {
    id: string;
    image: string;
    detail: string | null;
    isPrimary: boolean;
    index: number;
  }[];
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: ProductFormInitialData | null;
  categories: { id: string; name: string }[];
}

function createEmptyImage(isPrimary = false): ProductImageField {
  return {
    image: "",
    detail: "",
    isPrimary,
  };
}

function getDefaultImages(initialData: ProductFormInitialData | null) {
  if (!initialData || initialData.images.length === 0) {
    return [createEmptyImage(true)];
  }

  return initialData.images.map((image) => ({
    image: image.image,
    detail: image.detail || "",
    isPrimary: image.isPrimary,
  }));
}

export function ProductFormDialog({
  open,
  onOpenChange,
  initialData,
  categories,
}: ProductFormDialogProps) {
  const [images, setImages] = useState<ProductImageField[]>(() => getDefaultImages(initialData));
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      categoryId: initialData?.categoryId || "",
      quantity: initialData?.quantity ?? 0,
      retailPrice: initialData?.retailPrice ?? 0,
      wholesalePrice: initialData?.wholesalePrice ?? 0,
      wholesaleMinQuantity: initialData?.wholesaleMinQuantity ?? 5,
      discount: initialData?.discount ?? undefined,
      description: initialData?.description || "",
      warranty: initialData?.warranty || "",
      finish: initialData?.finish || "",
      material: initialData?.material || "",
      tags: initialData?.tags.join(", ") || "",
    },
  });

  const addImage = () => {
    setImages((current) => [...current, createEmptyImage(current.length === 0)]);
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      if (next.length === 0) {
        return [createEmptyImage(true)];
      }
      if (!next.some((image) => image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const updateImageField = (index: number, field: keyof ProductImageField, value: string | boolean) => {
    setImages((current) =>
      current.map((image, currentIndex) =>
        currentIndex === index
          ? { ...image, [field]: value }
          : image
      )
    );
  };

  const setPrimaryImage = (index: number) => {
    setImages((current) =>
      current.map((image, currentIndex) => ({
        ...image,
        isPrimary: currentIndex === index,
      }))
    );
  };

  const uploadImageAtIndex = async (index: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image must be 2MB or smaller.");
      return;
    }

    setUploadingIndex(index);
    try {
      const signRes = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });

      const signPayload = (await signRes.json()) as {
        error?: string;
        bucket?: string;
        path?: string;
        token?: string;
      };

      if (!signRes.ok || !signPayload.bucket || !signPayload.path || !signPayload.token) {
        throw new Error(signPayload.error || "Could not prepare upload.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(signPayload.bucket)
        .uploadToSignedUrl(signPayload.path, signPayload.token, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      updateImageField(index, "image", signPayload.path);
      toast.success("Image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      toast.error(message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const normalizedImages = images
        .map((image, index) => ({
          image: image.image.trim(),
          detail: image.detail.trim(),
          isPrimary: image.isPrimary,
          index,
        }))
        .filter((image) => image.image.length > 0)
        .map((image, index, allImages) => ({
          ...image,
          isPrimary: image.isPrimary || (!allImages.some((entry) => entry.isPrimary) && index === 0),
          index,
        }));

      if (normalizedImages.length === 0) {
        toast.error("Add at least one product image.");
        return;
      }

      const payload = {
        ...data,
        tags: (data.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        images: normalizedImages,
      };

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
    } catch {
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
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={categories.length === 0}
                  >
                    <SelectTrigger id="categoryId">
                      <SelectValue placeholder={categories.length === 0 ? "Create a category first" : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.categoryId && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
              {categories.length === 0 && (
                <p className="text-[0.8rem] text-amber-700">Add at least one category before creating a product.</p>
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
              <Label htmlFor="retailPrice">Retail Price (₹)</Label>
              <Input id="retailPrice" type="number" step="0.01" {...form.register("retailPrice")} />
              {form.formState.errors.retailPrice && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.retailPrice.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Wholesale Price (₹)</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input id="discount" type="number" min="0" max="100" placeholder="Optional" {...form.register("discount")} />
              {form.formState.errors.discount && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.discount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="Mixer, premium, brass" {...form.register("tags")} />
              {form.formState.errors.tags && (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.tags.message}</p>
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-base font-semibold">Product Images</Label>
                <p className="text-sm text-muted-foreground">Add 3 to 4 images and mark one as the primary thumbnail.</p>
              </div>
              <Button type="button" onClick={addImage} variant="secondary">
                <Plus className="mr-2 h-4 w-4" /> Add Image
              </Button>
            </div>
            <div className="space-y-4">
              {images.map((image, index) => (
                <div key={`${index}-${image.image}`} className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 md:grid-cols-[120px_1fr]">
                  <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
                    {image.image ? (
                      <img src={normalizeImageSrc(image.image)} alt="Product preview" className="h-28 w-full object-cover" />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                        Preview
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid flex-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`image-${index}`}>Image URL</Label>
                          <Input
                            id={`image-${index}`}
                            placeholder="Storage path or image URL"
                            value={image.image}
                            onChange={(event) => updateImageField(index, "image", event.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`upload-image-${index}`}>Upload Image (max 2MB)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`upload-image-${index}`}
                              type="file"
                              accept="image/*"
                              disabled={uploadingIndex === index}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void uploadImageAtIndex(index, file);
                                }
                                event.currentTarget.value = "";
                              }}
                            />
                            {uploadingIndex === index ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Upload className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`detail-${index}`}>Image Note</Label>
                          <Input
                            id={`detail-${index}`}
                            placeholder="Front angle, finish close-up, installed view"
                            value={image.detail}
                            onChange={(event) => updateImageField(index, "detail", event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          type="button"
                          variant={image.isPrimary ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPrimaryImage(index)}
                        >
                          <Star className="mr-1 h-3.5 w-3.5" />
                          {image.isPrimary ? "Primary" : "Make Primary"}
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeImage(index)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting || categories.length === 0} type="submit">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
