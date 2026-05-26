import { HttpError, PersistenceHttpClient, RequestWithParams } from "@url-shortner/http";
import { RedisService } from "@url-shortner/redis";

const _factory = (opts: {
    httpClient: PersistenceHttpClient,
    redisService: RedisService
}) => {
    const { httpClient, redisService } = opts;

    const redirect = async (req: RequestWithParams<{ shortCode: string }>, res: any) => {
        const cacheKey = `shortlink:${req.params.shortCode}`;
        try {
            //Get from cache
            const cache = await redisService.get(cacheKey);
            if (cache) {
                return res.status(302).redirect(cache);
            }

            //on cache miss, get from persistence and set cache
            const { originalUrl } = await httpClient.getOriginalUrlFromShortLink({
                key: req.params.shortCode,
                "x-request-id": req.requestId
            });

            await redisService.set(cacheKey, originalUrl);

            return res.status(302).redirect(originalUrl);
        } catch (error) {
            if (error instanceof HttpError && error.status === 404) {
                return res.status(404).json({ error: "Not Found" });
            }

            throw error;
        }

    }

    return {
        redirect
    }
}

export default _factory;