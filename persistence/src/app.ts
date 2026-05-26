import cors from "cors";
import express from "express";


import createHealthRestController from "./controllers/health.controller";
import createShortUrlRestController from "./controllers/short-url.controller";
import createWithIdempotentResultMiddleware from './middlewares/withIdempotentResult';
import createShortUrlServiceFactory from "./core/shortner-url.service";
import { withScopedShortUrlServiceFactory } from "./middlewares/withScopedService";
import { redisClient as redisClient, prisma, appConfigs, optimisticConcurrentLimitServiceFactory, idempotentResultServiceFactory, withObservability, withZodValidation } from "./composition";

import { createWithMovingWindowRateLimitingMiddleware } from '@url-shortner/http';
import { rateLimitingServiceFactory } from "@url-shortner/services";
import { ShortUrlCreatePayload, ShortUrlCreatePayloadZodObject, ShortUrlKey, ShortUrlKeyZodObject, IdempotentRequestHeadersZodObject } from "@url-shortner/contracts";
import { RequestWithBody, RequestWithParams, createWithErrorHandlingMiddleware } from "@url-shortner/http";


//creating express middlewares
const { withMovingWindowRateLimiting } = createWithMovingWindowRateLimitingMiddleware({
    rateLimitingServiceFactory: rateLimitingServiceFactory(redisClient)
});

const { withIdempotentResults } = createWithIdempotentResultMiddleware({
    concurrentServiceFactory: optimisticConcurrentLimitServiceFactory,
    idempotentServiceFactory: idempotentResultServiceFactory
});

const { withErrorHandling } = createWithErrorHandlingMiddleware();

const withScopedShortUrlService = withScopedShortUrlServiceFactory(() => createShortUrlServiceFactory(prisma));

const app = express();

app.use(cors(),
    express.json(),
    withObservability(),
    withMovingWindowRateLimiting({
        limit: appConfigs.RATE_LIMIT_MAX_REQUESTS,
        windowMs: appConfigs.RATE_LIMIT_WINDOW_MS
    }),
);

app.get("/health", (req, res) => createHealthRestController().healthCheck(req, res));

app.get("/short-url/:key",
    withZodValidation(ShortUrlKeyZodObject, req => ({ ...req.params, ...req.headers })),
    withScopedShortUrlService(prisma),
    async (req: RequestWithParams<ShortUrlKey>, res) =>
        await createShortUrlRestController(req.container!.shortUrlService!).getShortUrl(req, res)
)

app.post("/short-url",
    withZodValidation(ShortUrlCreatePayloadZodObject, req => req.body),
    withZodValidation(IdempotentRequestHeadersZodObject, req => req.headers),
    withIdempotentResults((req: RequestWithBody<ShortUrlCreatePayload>) => `${req.headers['idempotency-key']}::${req.body.originalUrl}`),
    withScopedShortUrlService(prisma),
    async (req, res) => await createShortUrlRestController(req.container!.shortUrlService!).createShortUrl(req, res)
)


app.use(withErrorHandling);

export default app;

