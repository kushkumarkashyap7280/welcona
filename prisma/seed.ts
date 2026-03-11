import { PrismaClient, Prisma } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * model User {
  id        String    @id @default(uuid())
  verified  Boolean   @default(false)
  email     String    @unique
  password  String?
  mobile    String    @unique
  googleId  String?   @unique
  avatarUrl String?
  fullName  String?
  orders    Order[]
  cart      Cart?
  addresses Address[]
  ratings   Rating[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}


model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  avatarUrl String?
  fullName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
 */

const userData: Prisma.UserCreateInput[] = [
    {
    email: "user1@gmail.com",
    password: "password",
    mobile: "1234567890",
    verified: true,
    googleId: null,
    avatarUrl: null,
    fullName: "user1",
  },
  {
    email: "user2@gmail.com",
    password: "password",
    mobile: "0987654321",
    verified: true,
    googleId: null,
    avatarUrl: null,
    fullName: "user2",
  }    

   
];

const adminData: Prisma.AdminCreateInput[] = [
  {
    email: "admin1@gmail.com",
    password: "password",
    avatarUrl: null,
    fullName: null,
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
  for (const a of adminData) {
    await prisma.admin.create({ data: a });
  }
}

main();


