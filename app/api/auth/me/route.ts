import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      verified: true,
    },
  });

  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json({ ...user, role: session.role });
}
