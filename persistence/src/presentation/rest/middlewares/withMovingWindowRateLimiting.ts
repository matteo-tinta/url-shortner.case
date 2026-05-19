import { Request, Response, NextFunction } from 'express';
import { client as redisClient } from '../../../composition';

// Moving window rate limiting middleware
const withMovingWindowRateLimiting = (opts: {
    limit: number; windowMs: number;
}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { limit, windowMs } = opts;

        const ip = req.ip || 'unknown';
        const key = `rate_limit:${ip}`;
        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            // Remove entries older than windowMs
            await redisClient.zRemRangeByScore(key, '-inf', windowStart);

            // Count requests within the time window
            const currentCount = await redisClient.zCard(key);

            if (currentCount >= limit) {
                return res.status(429).json({ error: "Too Many Requests" });
            }

            // Add current request
            await redisClient.zAdd(key, {
                score: now,
                value: `${ip}:${now}`
            });

            // Set expiration
            await redisClient.expire(key, Math.ceil(windowMs * 3 / 1000));

            next();
        } catch (err) {
            console.error("Rate limiting error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    };
};

export { withMovingWindowRateLimiting };