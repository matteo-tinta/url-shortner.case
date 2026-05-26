import { RedisService } from "@url-shortner/redis";

export type RateLimitingServiceFactory = ReturnType<typeof _factory>;
export type RateLimitingService = ReturnType<RateLimitingServiceFactory>;

const _factory = (
    client: RedisService
) => (opts: { limit: number; windowMs: number, key: string }) => {
    const { limit, windowMs } = opts;
    const fullKey = `rate_limit:${opts.key}`;

    const upsertRequestTimestamp = async () => {
        const now = Date.now();

        await cleanupOldEntries();

        await client.zAdd(fullKey, {
            score: now,
            value: `${fullKey}:${now}`
        });
        await client.expire(fullKey, Math.ceil(windowMs * 3 / 1000));
    }

    const isRateLimited = async () => {
        const currentCount = await client.zCard(fullKey);
        return currentCount >= limit;
    }

    const getLastRequestRetryAfter = async () => {
        const [first = { score: new Date().getTime() }] =
            await client.zRangeWithScores(fullKey, 0, 0);

        const date = first.score + windowMs;

        return {
            timestamp: date,
            httpDate: new Date(date).toUTCString()
        }
    }

    const cleanupOldEntries = async () => {
        const now = Date.now();
        const windowStart = now - windowMs;

        await client.zRemRangeByScore(fullKey, '-inf', windowStart);
    }

    return {
        upsertRequestTimestamp,
        isRateLimited,
        cleanupOldEntries,
        getLastRequestTimestamp: getLastRequestRetryAfter,
    }
}

export default _factory;