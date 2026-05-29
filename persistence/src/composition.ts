import { PrismaClient } from "./persistence/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { configure } from "@url-shortner/config";
import { configSchema } from "./config";
import createIdempotentResultServiceFactory from "./core/idempotent.service";
import createOptimisticConcurrentLimitServiceFactory from "./core/optimistic-concurrent.service";
import { installObservability } from "@url-shortner/observability";
import { createWithObservability, createWithServiceAuthenticationMiddleware } from "@url-shortner/http";
import { ZodObject } from "zod";
import { withZodValidation as createWithZodValidation } from "@url-shortner/http";
import { Request } from "express";
import { installRedis } from "@url-shortner/redis";
import { createFetch, createIssuerHttpClient, createRedirectHttpClient } from "@url-shortner/http";
import { issuerTokenServiceFactory } from "@url-shortner/services";

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
    serviceName: "persistence-service",
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

const issuerFetch = createFetch({
    fetch: globalThis.fetch,
    baseUrl: appConfigs.ISSUER_API_BASE_URL,
    withSpan: observability.withSpan,
});

const issuerHttpClient = createIssuerHttpClient({ fetch: issuerFetch });

const issuerTokenService = issuerTokenServiceFactory({
    requestToken: issuerHttpClient.requestToken,
    sub: appConfigs.SERVICE_ID,
    aud: appConfigs.OUTBOUND_SERVICE_AUDIENCE,
});

export const redirectHttpClient = createRedirectHttpClient({
    fetch: redirectFetch,
    getServiceToken: issuerTokenService.getToken,
    serviceId: appConfigs.SERVICE_ID,
});

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

const withServiceAuthenticationFactory = createWithServiceAuthenticationMiddleware({
    logger: logger.logger,
    meter,
    issuerHttpClient,
    expectedIss: appConfigs.AUTH_ISSUER,
    expectedAud: appConfigs.SERVICE_ID,
    allowedCallers: appConfigs.AUTH_ALLOWED_CALLERS.split(",").map(v => v.trim()).filter(Boolean),
});

export const withServiceAuthentication = withServiceAuthenticationFactory.withServiceAuthentication;

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

