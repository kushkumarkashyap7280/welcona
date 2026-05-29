import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendAdminHealthCheckEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Protect the route if CRON_SECRET is configured
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Fetch total number of products
    const productCount = await prisma.product.count();

    // 2. Fetch admin notification email from env
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (!adminEmail) {
      console.error("ADMIN_NOTIFICATION_EMAIL is not defined in environment variables.");
      return NextResponse.json(
        { error: "ADMIN_NOTIFICATION_EMAIL environment variable is missing." },
        { status: 500 }
      );
    }

    // 3. Send email to admin
    const emailResult = await sendAdminHealthCheckEmail(adminEmail, productCount);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send health check email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Health check email sent successfully.",
      productCount,
      recipient: adminEmail,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during the cron execution." },
      { status: 500 }
    );
  }
}
