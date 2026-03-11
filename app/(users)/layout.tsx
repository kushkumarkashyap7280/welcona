import { SiteHeader } from "@/components/users/SiteHeader";
import { SiteFooter } from "@/components/users/SiteFooter";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
