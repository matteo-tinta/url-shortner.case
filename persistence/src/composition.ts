import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma Client initialization with PostgreSQL adapter
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
