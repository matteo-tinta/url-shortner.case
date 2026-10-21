import { ShortUrlKey, ShortUrlKeyZodObject, ShortUrlResponseZodObject } from "@url-shortner/contracts";
import { default as createHttpClient } from "./http-client.service";

export type PersistenceHttpClient = ReturnType<typeof _factory>;

const _factory = (options: {
    fetch: typeof fetch,
    getServiceToken?: () => Promise<string>,
    serviceId?: string,
}) => {
    const client = createHttpClient(options);

    const getOriginalUrlFromShortLink = async (req: ShortUrlKey) => {
        const url = ShortUrlKeyZodObject.parse(req);
        const token = options.getServiceToken ? await options.getServiceToken() : undefined;

        const response = await client.get(`/short-url/${url.key}`, {
            requestId: req["x-request-id"],
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.serviceId ? { "X-Service-Id": options.serviceId } : {}),
            },
        });

        return await client.validateResponseAsJsonAndReturn(response, ShortUrlResponseZodObject);
    }

    return {
        getOriginalUrlFromShortLink
    };
}

export default _factory;