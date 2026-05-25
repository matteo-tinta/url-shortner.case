import { createClient } from "redis";

export type RedisClient = ReturnType<typeof _factory>;

const _factory = (
    options: {
        url: string
    }
) => {
    const redisClient = createClient({
        url: options.url
    });

    redisClient.on('error', err => console.log('Redis Client Error', err));

    return {
        redisClient
    };
}

export default _factory;
