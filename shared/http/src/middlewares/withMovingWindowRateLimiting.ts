import { Request, Response, NextFunction } from 'express';
import { RateLimitingServiceFactory } from '@url-shortner/services';

// Moving window rate limiting middleware
const _factory = (opts: {
    rateLimitingServiceFactory: RateLimitingServiceFactory;
}) => {
    const { rateLimitingServiceFactory } = opts;

    const withMovingWindowRateLimiting = (opts: {
        limit: number;
        windowMs: number;
    }) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const ip = req.ip || 'unknown';
            const { limit, windowMs } = opts;

            const service = rateLimitingServiceFactory({
                key: ip,
                limit,
                windowMs
            });

            try {
                // Remove entries older than windowMs
                await service.cleanupOldEntries();

                const isRateLimited = await service.isRateLimited();

                if (isRateLimited) {
                    const { httpDate } = await service.getLastRequestTimestamp();
                    res.setHeader('Retry-After', httpDate);

                    return res
                        .status(429)
                        .json({ error: "Too many requests" });
                }

                // Add current request
                await service.upsertRequestTimestamp();

                next();

            } catch (err) {
                console.error("Rate limiting error:", err);
                throw err;
            }
        };
    };

    return {
        withMovingWindowRateLimiting
    }
}

export default _factory;