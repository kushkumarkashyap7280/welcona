import { getSessionUser } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/db";
import { ProductForm } from "../../components/ProductForm";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { index: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-2">
            Modify product details, pricing, images and other information.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Product: <span className="font-medium">{product.name}</span> • SKU: <span className="font-mono">{product.sku}</span>
          </p>
        </div>
      </div>

      <ProductForm initialData={product} categories={categories} />
    </div>
  );
}