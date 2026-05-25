import { SetOptions, createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

export interface RedisService {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, options?: SetOptions) => Promise<string | null>;
    del: (key: string) => Promise<number>;
    INCR: (key: string) => Promise<number>;
    DECR: (key: string) => Promise<number>;
    expire: (key: string, seconds: number) => Promise<number>;
    zAdd: (key: string, member: { score: number; value: string }) => Promise<number>;
    zCard: (key: string) => Promise<number>;
    zRemRangeByScore: (key: string, min: number | string, max: number | string) => Promise<number>;
    zRangeWithScores: (key: string, start: number, stop: number) => Promise<{ value: string; score: number }[]>;
    watch: (key: string) => Promise<string>;
    unwatch: () => Promise<string>;
    multi: () => ReturnType<RedisClient["multi"]>;
}

const _factory = (client: RedisClient): RedisService => {
    const _tryOrFail = async <T>(fn: () => Promise<T>) => {
        try {
            return await fn();
        } catch (err) {
            console.error("Redis operation failed:", err);
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