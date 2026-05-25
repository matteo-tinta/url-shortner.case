import createConfigService from "./core/config.service";
import { redisServiceFactory, createRedisClient } from "@url-shortner/services";
import { createFetch, createPersistenceHttpClient, } from "@url-shortner/http";

//Configuration
export const appConfigs = createConfigService(process.env).getConfig();

//Redis Client
export const { redisClient } = createRedisClient({
    url: appConfigs.REDIS_URL
});

export const redisService = redisServiceFactory(redisClient);

//Http Clients
const fetchFn = createFetch({
    fetch: globalThis.fetch,
    baseUrl: appConfigs.PERSISTENCE_API_BASE_URL
});

export const persistenceHttpClient = createPersistenceHttpClient({ fetch: fetchFn });

export async function initializePersistence() {
    await redisClient.connect();
}

export async function cleanup() {
    redisClient.destroy();
}

