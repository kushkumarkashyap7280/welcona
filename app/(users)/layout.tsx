import { getSessionUser } from "@/lib/session";
import { UserPanelShell } from "@/components/users/UserPanelShell";
import prisma from "@/lib/db";
import type { SessionUser } from "@/components/providers/AuthProvider";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  let user: SessionUser | null = null;

  if (session) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        verified: true,
      },
    });
    if (dbUser) {
      user = { ...dbUser, role: "customer" };
    }
  }

  return <UserPanelShell user={user}>{children}</UserPanelShell>;
}
