import { ShortUrlKey, ShortUrlKeyZodObject, ShortUrlResponseZodObject } from "@url-shortner/contracts";
import { default as createHttpClient } from "./http-client.service";

export type PersistenceHttpClient = ReturnType<typeof _factory>;

const _factory = (options: {
    fetch: typeof fetch
}) => {
    const client = createHttpClient(options);

    const getOriginalUrlFromShortLink = async (req: ShortUrlKey) => {
        const url = ShortUrlKeyZodObject.parse(req);

        const response = await client.get(`/short-url/${url.key}`, {
            requestId: req["x-request-id"],
        });

        return await client.validateResponseAsJsonAndReturn(response, ShortUrlResponseZodObject);
    }

    return {
        getOriginalUrlFromShortLink
    };
}

export default _factory;