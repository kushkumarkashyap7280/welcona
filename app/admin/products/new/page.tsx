import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { ProductForm } from "../components/ProductForm";

export default async function NewProductPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  if (categories.length === 0) {
    redirect("/admin/categories");
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
          <p className="text-muted-foreground mt-2">
            Add a new product to your inventory with detailed information and images.
          </p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}