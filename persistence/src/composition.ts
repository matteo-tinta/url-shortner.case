import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import createConfigService from "./core/config.service";
import createIdempotentResultServiceFactory from "./core/idempotent.service";
import createOptimisticConcurrentLimitServiceFactory from "./core/optimistic-concurrent.service";
import { installObservability } from "@url-shortner/observability";
import { createWithObservability } from "@url-shortner/http";
import { ZodObject } from "zod";
import { withZodValidation as createWithZodValidation } from "@url-shortner/http";
import { Request } from "express";
import { installRedis } from "@url-shortner/redis";

//Configuration
export const appConfigs = createConfigService(process.env).getConfig();

// Prisma Client initialization with PostgreSQL adapter
const adapter = new PrismaPg({
    connectionString: appConfigs.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });


//Observability
const observability = installObservability({
    env: "development",
    serviceName: "redirect-service",
    serviceVersion: "1.0.0",
});

//Redis
export const { client: redisClient, service: redisService } = installRedis({
    url: appConfigs.REDIS_URL,
    logger: observability.logger.logger,
});


export const { logger, meter } = observability;
export const idempotentResultServiceFactory = createIdempotentResultServiceFactory(redisService);
export const optimisticConcurrentLimitServiceFactory = createOptimisticConcurrentLimitServiceFactory(redisService);
export const withZodValidation = (schema: ZodObject, selector: (req: Request) => any) => createWithZodValidation({
    schema,
    logger: logger.logger,
    selector,
});

export const withObservability = createWithObservability({
    logger: logger.logger,
    meter: meter,
})

export async function initializePersistence() {
    await prisma.$connect();
    await redisClient.connect();
    observability.install();
}

export async function cleanup() {
    await prisma.$disconnect();
    redisClient.destroy();
    await observability.destroy();
}

