import { SetOptions, createClient } from "redis";
import { Logger } from "../types/logger";

type RedisClient = ReturnType<typeof createClient>;

export interface RedisService {
    get: (_key: string) => Promise<string | null>;
    set: (_key: string, _value: string, _options?: SetOptions) => Promise<string | null>;
    del: (_key: string) => Promise<number>;
    INCR: (_key: string) => Promise<number>;
    DECR: (_key: string) => Promise<number>;
    expire: (_key: string, _seconds: number) => Promise<number>;
    zAdd: (_key: string, _member: { score: number; value: string }) => Promise<number>;
    zCard: (_key: string) => Promise<number>;
    zRemRangeByScore: (_key: string, _min: number | string, _max: number | string) => Promise<number>;
    zRangeWithScores: (_key: string, _start: number, _stop: number) => Promise<{ value: string; score: number }[]>;
    watch: (_key: string) => Promise<string>;
    unwatch: () => Promise<string>;
    multi: () => ReturnType<RedisClient["multi"]>;
}

const _factory = (options: {
    client: RedisClient,
    logger: Logger
}): RedisService => {
    const { client, logger } = options;

    const _tryOrFail = async <T>(fn: () => Promise<T>) => {
        try {
            return await fn();
        } catch (err) {
            logger.error("Redis operation failed:", err);
            throw new Error("Internal Server Error");
        }
    }

    const get = (key: string) => {
        return _tryOrFail(async () => await client.get(key));
    }

    const set = (key: string, value: string, options?: SetOptions) => {
        return _tryOrFail(async () => await client.set(key, value, options));
    }

    const del = (key: string) => {
        return _tryOrFail(async () => await client.del(key));
    }

    const INCR = (key: string) => {
        return _tryOrFail(async () => await client.INCR(key));
    }

    const DECR = (key: string) => {
        return _tryOrFail(async () => await client.DECR(key));
    }

    const expire = (key: string, seconds: number) => {
        return _tryOrFail(async () => await client.expire(key, seconds));
    }

    const zAdd = (key: string, member: { score: number; value: string }) => {
        return _tryOrFail(async () => await client.zAdd(key, member));
    }

    const zCard = (key: string) => {
        return _tryOrFail(async () => await client.zCard(key));
    }

    const zRemRangeByScore = (key: string, min: number | string, max: number | string) => {
        return _tryOrFail(async () => await client.zRemRangeByScore(key, min, max));
    }

    const zRangeWithScores = (key: string, start: number, stop: number) => {
        return _tryOrFail(async () => await client.zRangeWithScores(key, start, stop));
    }

    const watch = (key: string) => {
        return _tryOrFail(async () => await client.watch(key));
    }

    const unwatch = () => {
        return _tryOrFail(async () => await client.unwatch());
    }

    const multi = () => client.multi();

    return {
        get,
        set,
        del,
        INCR,
        DECR,
        zAdd,
        zCard,
        zRemRangeByScore,
        zRangeWithScores,
        expire,
        multi,
        watch,
        unwatch,
    };
}

export default _factory;