"use client";

import { useRef, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader2, Plus, Star, ArrowLeft, Package, Upload, Trash2,
  IndianRupee, Tags, ImageIcon, FileText, Settings
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import { ProductImage } from "@/components/ui/product-image";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { isSupabaseStoragePath } from "@/lib/utils";

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

interface ProductFormProps {
  initialData?: ProductFormInitialData | null;
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

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<ProductImageField[]>(() => getDefaultImages(initialData || null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      categoryId: initialData?.categoryId || "",
      quantity: initialData?.quantity || 0,
      retailPrice: initialData?.retailPrice || 0,
      wholesalePrice: initialData?.wholesalePrice || 0,
      wholesaleMinQuantity: initialData?.wholesaleMinQuantity || 1,
      discount: initialData?.discount || undefined,
      description: initialData?.description || "",
      warranty: initialData?.warranty || "",
      finish: initialData?.finish || "",
      material: initialData?.material || "",
      tags: initialData?.tags?.join(", ") || "",
    },
  });

  const addImage = () => {
    const hasPrimary = images.some((image) => image.isPrimary);
    setImages([...images, createEmptyImage(!hasPrimary)]);
  };

  const removeImageState = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);

    // If we removed the primary image, make the first image primary
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }

    setImages(newImages.length > 0 ? newImages : [createEmptyImage(true)]);
  };

  const deleteImageFromStorage = async (path: string) => {
    if (!isSupabaseStoragePath(path)) {
      return;
    }

    const response = await fetch("/api/admin/uploads/product-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error || "Failed to delete previous image from storage.");
    }
  };

  const deleteImageAtIndex = async (index: number) => {
    const current = images[index];
    if (!current) {
      return;
    }

    const currentPath = current.image.trim();
    try {
      if (currentPath) {
        await deleteImageFromStorage(currentPath);
      }
      removeImageState(index);
      toast.success("Image deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete image.";
      toast.error(message);
    }
  };

  const updateImage = (index: number, field: keyof ProductImageField, value: string | boolean) => {
    const newImages = [...images];

    if (field === "isPrimary" && value === true) {
      // Remove primary from all other images
      newImages.forEach((image, i) => {
        image.isPrimary = i === index;
      });
    } else {
      (newImages[index] as any)[field] = value;
    }

    setImages(newImages);
  };

  const uploadImageAtIndex = async (index: number, file: File, replaceExisting = false) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image must be 2MB or smaller.");
      return;
    }

    const previousPath = images[index]?.image.trim() ?? "";

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

      updateImage(index, "image", signPayload.path);

      if (replaceExisting && previousPath && previousPath !== signPayload.path) {
        try {
          await deleteImageFromStorage(previousPath);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete previous image.";
          toast.error(message);
        }
      }

      toast.success(replaceExisting ? "Image replaced" : "Image uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      toast.error(message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
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
          toast.success("Product updated successfully");
          router.push("/admin/products");
        }
      } else {
        const res = await createProductAction(payload);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Product created successfully");
          router.push("/admin/products");
        }
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Enter product name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      {...form.register("sku")}
                      placeholder="Product SKU"
                      className="font-mono"
                    />
                    {form.formState.errors.sku && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.sku.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Controller
                      name="categoryId"
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.categoryId && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Stock Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      {...form.register("quantity")}
                      min="0"
                      placeholder="0"
                    />
                    {form.formState.errors.quantity && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.quantity.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Detailed product description..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Product Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      {...form.register("material")}
                      placeholder="e.g., Wood, Metal, Plastic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finish">Finish</Label>
                    <Input
                      id="finish"
                      {...form.register("finish")}
                      placeholder="e.g., Matte, Glossy, Textured"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input
                    id="warranty"
                    {...form.register("warranty")}
                    placeholder="e.g., 1 year, 6 months"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    {...form.register("tags")}
                    placeholder="Separate tags with commas (e.g., modern, furniture, office)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tags help customers find your products more easily
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retailPrice">Retail Price (₹) *</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    {...form.register("retailPrice")}
                    min="0"
                    placeholder="0.00"
                  />
                  {form.formState.errors.retailPrice && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.retailPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Price (₹) *</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    step="0.01"
                    {...form.register("wholesalePrice")}
                    min="0"
                    placeholder="0.00"
                  />
                  {form.formState.errors.wholesalePrice && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.wholesalePrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wholesaleMinQuantity">Min. Wholesale Qty *</Label>
                  <Input
                    id="wholesaleMinQuantity"
                    type="number"
                    {...form.register("wholesaleMinQuantity")}
                    min="1"
                    placeholder="1"
                  />
                  {form.formState.errors.wholesaleMinQuantity && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.wholesaleMinQuantity.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount %</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    {...form.register("discount")}
                    min="0"
                    max="100"
                    placeholder="Optional"
                  />
                  {form.formState.errors.discount && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {form.formState.errors.discount.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {initialData ? "Update Product" : "Create Product"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href="/admin/products">Cancel</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Product Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <div key={index} className="min-w-[320px] max-w-[320px] shrink-0 p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Image {index + 1}</span>
                      {image.isPrimary && (
                        <div className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          <Star className="w-3 h-3" />
                          Primary
                        </div>
                      )}
                    </div>
                    {uploadingIndex === index && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <Input
                    ref={(element) => {
                      fileInputRefs.current[index] = element;
                    }}
                    id={`upload-image-${index}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingIndex === index}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const hasExistingPath = image.image.trim().length > 0;
                        void uploadImageAtIndex(index, file, hasExistingPath);
                      }
                      e.currentTarget.value = "";
                    }}
                  />

                  {!image.image ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploadingIndex === index}
                    >
                      {uploadingIndex === index ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        disabled={uploadingIndex === index}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => void deleteImageAtIndex(index)}
                        disabled={uploadingIndex === index}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Image Description</Label>
                    <Input
                      value={image.detail}
                      onChange={(e) => updateImage(index, "detail", e.target.value)}
                      placeholder="Brief description of the image"
                    />
                  </div>

                  {image.image && (
                    <div className="mt-3">
                      <ProductImage
                        src={image.image}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                        fallbackSize="lg"
                      />
                    </div>
                  )}

                  {!image.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateImage(index, "isPrimary", true)}
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Set as Primary Image
                    </Button>
                  )}
                </div>
              ))}

              <div className="min-w-55 shrink-0 flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Image
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}