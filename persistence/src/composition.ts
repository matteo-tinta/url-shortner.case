import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from 'redis';
import createConfigService from "./core/config.service";

//Configuration
export const appConfigs = createConfigService().getConfig();

// Prisma Client initialization with PostgreSQL adapter
const adapter = new PrismaPg({
    connectionString: appConfigs.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

//Redis Client
export const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));

export type RedisClientType = typeof client;
