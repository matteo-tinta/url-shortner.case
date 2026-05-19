import { Request, Response, NextFunction } from 'express';
import { client as redisClient } from '../../../composition';

const withRedis = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        next();
    } catch (err) {
        console.error("Redis connection error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export { withRedis };