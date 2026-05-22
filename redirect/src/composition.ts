import { createClient } from 'redis';
import createConfigService from "./core/config.service";

import createRedisService from "./core/redis.service";

//Configuration
export const appConfigs = createConfigService(process.env).getConfig();

//Redis Client
export const redisClient = createClient({
    url: appConfigs.REDIS_URL
});
redisClient.on('error', err => console.log('Redis Client Error', err));

export type RedisClient = typeof redisClient;

export const redisService = createRedisService(redisClient);

export async function initializePersistence() {
    await redisClient.connect();
}

export async function cleanup() {
    redisClient.destroy();
}

