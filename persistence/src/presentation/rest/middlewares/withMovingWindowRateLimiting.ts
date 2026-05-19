import { Request, Response, NextFunction } from 'express';
import type { RedisClientType } from '../../../composition';

// Moving window rate limiting middleware
const _factory = (opts: {
    client: RedisClientType;
}) => {
    const { client } = opts;

    const withMovingWindowRateLimiting = (opts: {
        limit: number;
        windowMs: number;
    }) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const { limit, windowMs } = opts;

            const ip = req.ip || 'unknown';
            const key = `rate_limit:${ip}`;
            const now = Date.now();
            const windowStart = now - windowMs;

            try {
                // Remove entries older than windowMs
                await client.zRemRangeByScore(key, '-inf', windowStart);

                // Count requests within the time window
                const currentCount = await client.zCard(key);

                if (currentCount >= limit) {
                    return res.status(429).json({ error: "Too Many Requests" });
                }

                // Add current request
                await client.zAdd(key, {
                    score: now,
                    value: `${ip}:${now}`
                });

                // Set expiration
                await client.expire(key, Math.ceil(windowMs * 3 / 1000));

                next();
            } catch (err) {
                console.error("Rate limiting error:", err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
        };
    };

    return {
        withMovingWindowRateLimiting
    }
}

export default _factory;