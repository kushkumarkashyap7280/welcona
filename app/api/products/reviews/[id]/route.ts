import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json({ error: "Review system is decommissioned." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Review system is decommissioned." }, { status: 400 });
}
