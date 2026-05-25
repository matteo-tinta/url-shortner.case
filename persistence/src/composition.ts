import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import createConfigService from "./core/config.service";
import createIdempotentResultServiceFactory from "./core/idempotent.service";
import { redisServiceFactory, createRedisClient } from "@url-shortner/services";
import createOptimisticConcurrentLimitServiceFactory from "./core/optimistic-concurrent.service";


//Configuration
export const appConfigs = createConfigService(process.env).getConfig();

// Prisma Client initialization with PostgreSQL adapter
const adapter = new PrismaPg({
    connectionString: appConfigs.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });

//Redis Client
export const { redisClient } = createRedisClient({
    url: appConfigs.REDIS_URL
});

export const redisService = redisServiceFactory(redisClient);

export const idempotentResultServiceFactory = createIdempotentResultServiceFactory(redisService);
export const optimisticConcurrentLimitServiceFactory = createOptimisticConcurrentLimitServiceFactory(redisService);

export async function initializePersistence() {
    await prisma.$connect();
    await redisClient.connect();
}

export async function cleanup() {
    await prisma.$disconnect();
    redisClient.destroy();
}

