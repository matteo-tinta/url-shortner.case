import { Request, Response, NextFunction } from "express";
import { IdempotencyResult } from "../models/headers.models";
import { IdempotentRequest } from "@url-shortner/contracts";
import { IdempotentResultServiceFactory } from "../core/idempotent.service";
import { OptimisticConcurrentLockServiceFactory } from "../core/optimistic-concurrent.service";

const _factory = (options: {
    idempotentServiceFactory: IdempotentResultServiceFactory,
    concurrentServiceFactory: OptimisticConcurrentLockServiceFactory
}) => {
    const { idempotentServiceFactory, concurrentServiceFactory } = options;


    const withIdempotentResults = (keyFn: (_req: Request) => string) => {

        const _generateCacheKey = (req: Request) => {
            const idempotencyKey = keyFn(req);
            return Buffer.from(idempotencyKey).toString('base64');
        }

        return async (req: Request<IdempotentRequest>, res: Response, next: NextFunction) => {
            const idempotencyKey = _generateCacheKey(req);

            const _idempotentResultService = idempotentServiceFactory({
                key: idempotencyKey
            });

            const _optimisticConcurrentLimitService = concurrentServiceFactory({
                key: idempotencyKey,
                maxConcurrentRequests: 1,
                expirationTimeInSeconds: 5
            });

            //pessimistic approach so we can ensure that only one request with the same idempotency key is processed at a time.
            await _optimisticConcurrentLimitService.waitUntilLockAquiredOrTimeout();

            const cached = await _idempotentResultService.getIdempotencyResult();
            if (cached) {
                await _optimisticConcurrentLimitService.releaseLock();
                return res.status(cached.statusCode).json(cached.body);
            }


            // Capture outgoing payload from json/send
            let responseBody: unknown = undefined;

            const originalJson = res.json.bind(res);
            res.json = ((body: unknown) => {
                responseBody = body;
                return originalJson(body as any);
            }) as Response["json"];

            const originalSend = res.send.bind(res);
            res.send = ((body: unknown) => {
                if (responseBody === undefined) {
                    responseBody = body;
                }
                return originalSend(body as any);
            }) as Response["send"];

            // Store only after response is finished
            res.once("finish", async () => {
                await _optimisticConcurrentLimitService.releaseLock();

                if (responseBody === undefined || res.statusCode >= 300) {
                    return;
                }

                const resultToStore: IdempotencyResult = {
                    statusCode: res.statusCode,
                    body: responseBody
                };

                await _idempotentResultService.storeIdempotencyResult(resultToStore);
            });

            next();
        };
    }

    return {
        withIdempotentResults
    }
}

export default _factory;