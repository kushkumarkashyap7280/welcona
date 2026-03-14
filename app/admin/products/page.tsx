import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { ProductClient } from "./components/ProductClient";

export default async function ProductsPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  // Only fetch categories server-side for form validation
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProductClient categories={categories} />
    </div>
  );
}
