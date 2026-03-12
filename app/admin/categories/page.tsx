import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { CategoryClient } from "./components/CategoryClient";

export default async function CategoriesPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <CategoryClient data={categories} />
    </div>
  );
}
