import { redirect } from "next/navigation";

export const metadata = {
  title: "Welcona Admin",
};

export default async function AdminHomePageManagement() {
  redirect("/admin");
}
