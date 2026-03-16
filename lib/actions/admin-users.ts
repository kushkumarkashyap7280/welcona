"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function getAdminUsersFilter(query?: string, page: number = 1, pageSize: number = 10) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const whereClause = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { fullName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        fullName: true,
        mobile: true,
        verified: true,
        blocked: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAdminUserDetails(userId: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: {
            include: {
              product: { select: { id: true, name: true, sku: true } }
            }
          }
        }
      },
      ratings: {
        include: {
          product: { select: { id: true, name: true } }
        }
      }
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function toggleUserBlockStatus(userId: string, currentStatus: boolean) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { blocked: !currentStatus },
  });

  return { success: true, blocked: !currentStatus };
}
