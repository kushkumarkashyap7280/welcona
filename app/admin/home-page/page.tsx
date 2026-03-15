import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getHomeConfig } from "@/lib/home-config";
import { HomePageClient } from "./components/HomePageClient";
import prisma from "@/lib/db";

export const metadata = {
  title: "Home Page Management — Welcona Admin",
};

export default async function AdminHomePageManagement() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/");

  const [config, categories] = await Promise.all([
    getHomeConfig(),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Home Page Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Control what appears on your home page. Toggle sections on/off and
          edit content.
        </p>
      </div>
      <HomePageClient initialConfig={config} categories={categories} />
    </div>
  );
}
