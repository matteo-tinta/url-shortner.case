import { RedisService } from "@url-shortner/services";
import { IdempotencyResult, IdempotencyResultSchema } from "../models/headers.models";

export type IdempotentResultServiceFactory = ReturnType<typeof _factory>;
export type IdempotentResultService = ReturnType<ReturnType<typeof _factory>>;

const _factory = (client: RedisService) => function manage(opt: { key: string; }) {
    const resultKey = `${opt.key}:result`;
    const dayahead = 24 * 60 * 60; // 24 hours in seconds

    const getIdempotencyResult = async () => {
        const cachedResult = await client.get(resultKey);

        if (!cachedResult) {
            return null;
        }

        return _tryParseStoredResult(cachedResult);
    };

    const storeIdempotencyResult = async (result: IdempotencyResult) => {
        await client.set(resultKey, JSON.stringify(result), { EX: dayahead });
    };

    const _tryParseStoredResult = (raw: string): IdempotencyResult | null => {
        try {
            const parsed = JSON.parse(raw);
            const validated = IdempotencyResultSchema.safeParse(parsed);
            return validated.success ? validated.data : null;
        } catch {
            return null;
        }
    };

    return {
        getIdempotencyResult,
        storeIdempotencyResult
    };
};

export default _factory;