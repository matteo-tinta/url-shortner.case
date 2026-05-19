import { Request, Response, NextFunction } from 'express';
import type { RedisClientType } from '../../../composition';

const _factory = (client: RedisClientType) => {
    const withRedis = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!client.isOpen) {
                await client.connect();
            }
            next();
        } catch (err) {
            console.error("Redis connection error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    };

    return {
        withRedis
    }
};

export default _factory;