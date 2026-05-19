import { SetOptions } from "redis";
import { RedisClient } from "../composition";
import z from "zod";

export type RedisService = ReturnType<typeof _factory>;

const _factory = (client: RedisClient) => {
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