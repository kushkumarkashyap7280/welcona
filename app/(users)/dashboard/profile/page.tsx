import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";
import { UserProfileForm } from "@/components/users/UserProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session || session.role !== "customer") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, email: true, mobile: true },
  });

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-muted-foreground">
        View and update your profile information.
      </p>
      
      <div className="mt-8 max-w-2xl">
        <UserProfileForm 
          initialData={{
            fullName: user.fullName || "",
            email: user.email,
            mobile: user.mobile || "",
          }}
        />
      </div>
    </div>
  );
}
