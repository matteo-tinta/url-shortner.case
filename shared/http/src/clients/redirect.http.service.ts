import { CacheWritePayload, CacheWritePayloadZodObject } from "@url-shortner/contracts";
import { default as createHttpClient } from "./http-client.service";

export type RedirectHttpClient = ReturnType<typeof _factory>;

const _factory = (options: {
    fetch: typeof fetch,
    getServiceToken?: () => Promise<string>,
    serviceId?: string,
}) => {
    const client = createHttpClient(options);

    const populateCache = async (payload: CacheWritePayload): Promise<void> => {
        const body = CacheWritePayloadZodObject.parse(payload);
        const token = options.getServiceToken ? await options.getServiceToken() : undefined;

        await client.post("/cache", body, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.serviceId ? { "X-Service-Id": options.serviceId } : {}),
            },
        });
    };

    return { populateCache };
};

export default _factory;
