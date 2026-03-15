import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { DEFAULT_HOME_CONFIG, getHomeConfig } from "@/lib/home-config";
import type { HomePageConfig } from "@/lib/home-config";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getHomeConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<HomePageConfig>;

    const merged = { ...DEFAULT_HOME_CONFIG, ...body };

    await prisma.siteConfig.upsert({
      where: { key: "home_page" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { key: "home_page", value: JSON.parse(JSON.stringify(merged)) as any },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { value: JSON.parse(JSON.stringify(merged)) as any },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/admin/home-config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
