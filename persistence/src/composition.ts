import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from 'redis';

// Prisma Client initialization with PostgreSQL adapter
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });

//Redis Client
export const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));
