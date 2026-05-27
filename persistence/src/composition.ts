import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configure } from "@url-shortner/config";
import { configSchema } from "./config";
import createIdempotentResultServiceFactory from "./core/idempotent.service";
import createOptimisticConcurrentLimitServiceFactory from "./core/optimistic-concurrent.service";
import { installObservability } from "@url-shortner/observability";
import { createWithObservability } from "@url-shortner/http";
import { ZodObject } from "zod";
import { withZodValidation as createWithZodValidation } from "@url-shortner/http";
import { Request } from "express";
import { installRedis } from "@url-shortner/redis";
import { createFetch, createRedirectHttpClient } from "@url-shortner/http";

//Configuration
export const appConfigs = configure(process.env, configSchema).getConfig();

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


const redirectFetch = createFetch({
    fetch: globalThis.fetch,
    baseUrl: appConfigs.REDIRECT_API_BASE_URL,
    withSpan: observability.withSpan,
});

export const redirectHttpClient = createRedirectHttpClient({ fetch: redirectFetch });

export const { logger, meter } = observability;
export const idempotentResultServiceFactory = createIdempotentResultServiceFactory(redisService);
export const optimisticConcurrentLimitServiceFactory = createOptimisticConcurrentLimitServiceFactory(redisService);
export const withZodValidation = (schema: ZodObject, selector: (_req: Request) => any) => createWithZodValidation({
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

