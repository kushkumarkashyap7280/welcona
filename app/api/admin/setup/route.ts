import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, fullName, secretKey } = body;

    if(process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized. Invalid secretKey." }, { status: 401 });
    }

    // Use a hardcoded secret for this setup step to prevent unauthorized creation
    // The user can pass this secret via curl
    if (secretKey !== "welcona_setup_2026") {
      return NextResponse.json({ error: "Unauthorized. Invalid secretKey." }, { status: 401 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return NextResponse.json({ error: "Admin with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || "Super Admin",
        role: "SUPER_ADMIN",
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Admin created successfully.", 
      admin 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating admin via setup route:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
