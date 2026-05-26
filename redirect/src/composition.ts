import createConfigService from "./core/config.service";
import { createFetch, createPersistenceHttpClient, } from "@url-shortner/http";
import { installObservability } from "@url-shortner/observability";
import { installRedis } from "@url-shortner/redis";

//Configuration
export const appConfigs = createConfigService(process.env).getConfig();

//Observability
const observability = installObservability({
    env: "development",
    serviceName: "redirect-service",
    serviceVersion: "1.0.0",
});

//Redis Client
export const { client: redisClient, service: redisService } = installRedis({
    url: appConfigs.REDIS_URL,
    logger: observability.logger.logger
});

//Http Clients
const fetchFn = createFetch({
    fetch: globalThis.fetch,
    baseUrl: appConfigs.PERSISTENCE_API_BASE_URL,
    withSpan: observability.withSpan
});

export const persistenceHttpClient = createPersistenceHttpClient({ fetch: fetchFn });

export const { logger, tracer, meter } = observability;

export async function initializePersistence() {
    observability.install();
    await redisClient.connect();
}

export async function cleanup() {
    await observability.destroy();
    redisClient.destroy();
}

