import { CacheWritePayload, CacheWritePayloadZodObject } from "@url-shortner/contracts";
import { default as createHttpClient } from "./http-client.service";

export type RedirectHttpClient = ReturnType<typeof _factory>;

const _factory = (options: { fetch: typeof fetch }) => {
    const client = createHttpClient(options);

    const populateCache = async (payload: CacheWritePayload): Promise<void> => {
        const body = CacheWritePayloadZodObject.parse(payload);
        await client.post("/cache", body);
    };

    return { populateCache };
};

export default _factory;
