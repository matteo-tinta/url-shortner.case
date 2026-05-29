import { configure } from "@url-shortner/config";
import { configSchema } from "./config";
import { createFetch, createIssuerHttpClient, createPersistenceHttpClient, createWithServiceAuthenticationMiddleware } from "@url-shortner/http";
import { installObservability } from "@url-shortner/observability";
import { installRedis } from "@url-shortner/redis";
import { issuerTokenServiceFactory } from "@url-shortner/services";

//Configuration
export const appConfigs = configure(process.env, configSchema).getConfig();

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

const fetchFn = createFetch({
    fetch: globalThis.fetch,
    baseUrl: appConfigs.PERSISTENCE_API_BASE_URL,
    withSpan: observability.withSpan
});

export const persistenceHttpClient = createPersistenceHttpClient({
    fetch: fetchFn,
    getServiceToken: issuerTokenService.getToken,
    serviceId: appConfigs.SERVICE_ID,
});

export const { logger, tracer, meter } = observability;

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
    observability.install();
    await redisClient.connect();
}

export async function cleanup() {
    await observability.destroy();
    redisClient.destroy();
}

