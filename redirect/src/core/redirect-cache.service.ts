import { RedisService } from "@url-shortner/redis";

export type RedirectCacheService = ReturnType<typeof _factory>;

const _factory = (redisService: RedisService) => {
    const _buildKey = (shortCode: string) => `shortlink:${shortCode}`;
    const _day = 24 * 60 * 60; // seconds in a day

    const getFromCache = (shortCode: string): Promise<string | null> =>
        redisService.get(_buildKey(shortCode));

    const setInCache = (shortCode: string, originalUrl: string): Promise<void> =>
        redisService.set(_buildKey(shortCode), originalUrl, { EX: _day }).then(() => undefined);

    return { getFromCache, setInCache };
};

export default _factory;
