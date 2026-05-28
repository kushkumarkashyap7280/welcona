import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Review system is decommissioned." }, { status: 400 });
}

export async function POST() {
  return NextResponse.json({ error: "Review system is decommissioned." }, { status: 400 });
}
