import { HttpError, PersistenceHttpClient, RequestWithParams } from "@url-shortner/http";
import { RedirectCacheService } from "../core/redirect-cache.service";

const _factory = (opts: { httpClient: PersistenceHttpClient, cacheService: RedirectCacheService }) => {
    const { httpClient, cacheService } = opts;

    const redirect = async (req: RequestWithParams<{ shortCode: string }>, res: any) => {
        try {
            const cached = await cacheService.getFromCache(req.params.shortCode);
            if (cached) return res.status(302).redirect(cached);

            const { originalUrl } = await httpClient.getOriginalUrlFromShortLink({
                key: req.params.shortCode,
                "x-request-id": req.requestId,
            });

            await cacheService.setInCache(req.params.shortCode, originalUrl);

            return res.status(302).redirect(originalUrl);
        } catch (error) {
            if (error instanceof HttpError && error.status === 404) {
                return res.status(404).json({ error: "Not Found" });
            }
            throw error;
        }
    };

    return { redirect };
};

export default _factory;
