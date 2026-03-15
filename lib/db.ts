import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

// 1. Create a connection pool using the Transaction URL (Port 6543)
// The connection_limit=1 is vital for serverless to prevent 'too many connections'
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Initialize the adapter with that pool
const adapter = new PrismaPg(pool);

// 3. Create the client instance
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    // Optional: Log queries in development to see what's happening
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;