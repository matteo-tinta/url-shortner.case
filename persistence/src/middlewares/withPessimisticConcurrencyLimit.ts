import { Request, Response, NextFunction } from "express";
import { OptimisticConcurrentLockServiceFactory } from "../core/optimistic-concurrent.service";
import { IdempotentRequest, IdempotentRequestHeadersZodObject } from "../models/headers.models";

const _factory = (options: {
    concurrentServiceFactory: OptimisticConcurrentLockServiceFactory
}) => {
    const { concurrentServiceFactory } = options;

    const withConcurrencyLimit = (options?: {
        maxConcurrentRequests: number,
        expirationTimeInMs?: number
    }) => {
        const { maxConcurrentRequests = 1, expirationTimeInMs = 2500 }
            = options || { maxConcurrentRequests: 1, expirationTimeInMs: 2500 };

        return async (req: Request<IdempotentRequest>, res: Response, next: NextFunction) => {
            const idempotencyKey = req.headers["idempotency-key"];
            if (!idempotencyKey || typeof idempotencyKey !== "string") {
                throw new Error("Idempotency key is required in header 'idempotency-key'");
            }

            const _optimisticConcurrentLimitService = concurrentServiceFactory({
                key: `${idempotencyKey}:lock`,
                maxConcurrentRequests,
                expirationTimeInSeconds: expirationTimeInMs / 1000
            });

            await _optimisticConcurrentLimitService.waitUntilLockAquiredOrTimeout();

            res.once("finish", () => { void _optimisticConcurrentLimitService.releaseLock(); });

            next();
        }
    }

    return {
        withConcurrencyLimit
    }
}

export default _factory;