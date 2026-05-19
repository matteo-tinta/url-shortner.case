import cors from "cors";
import express from "express";

import createHealthRestController from "./controllers/health.controller";
import createShortUrlRestController from "./controllers/short-url.controller";
import withZodValidation from "./middlewares/withZodValidation";
import createWithMovingWindowRateLimitingMiddleware from './middlewares/withMovingWindowRateLimiting';
import createWithIdempotentResultMiddleware from './middlewares/withIdempotentResult';
import rateLimitingServiceFactory from "./core/rate-limiting.service";
import createWithErrorHandling from "./middlewares/withErrorHandling";
import createShortUrlServiceFactory from "./core/shortner-url.service";
import { withScopedShortUrlServiceFactory } from "./middlewares/withScopedService";
import { ShortUrlCreatePayload, ShortUrlCreatePayloadZodObject, ShortUrlGetParamsZodObject, ShortUrlGetRequestParams } from "./models/short-url.rest.models";
import { redisClient as redisClient, prisma, appConfigs, optimisticConcurrentLimitServiceFactory, idempotentResultServiceFactory } from "./composition";
import { RequestWithBody, RequestWithParams } from "./models/api.models";
import { IdempotentRequestHeadersZodObject } from "./models/headers.models";


//creating express middlewares
const { withMovingWindowRateLimiting } = createWithMovingWindowRateLimitingMiddleware({
    rateLimitingServiceFactory: rateLimitingServiceFactory(redisClient)
});

const { withIdempotentResults } = createWithIdempotentResultMiddleware({
    concurrentServiceFactory: optimisticConcurrentLimitServiceFactory,
    idempotentServiceFactory: idempotentResultServiceFactory
});

const { withErrorHandling } = createWithErrorHandling();

const withScopedShortUrlService = withScopedShortUrlServiceFactory(() => createShortUrlServiceFactory(prisma));

const app = express();

app.use(cors());

app.use(express.json());

// Limit to 3 requests per minute per IP
app.use(withMovingWindowRateLimiting({
    limit: appConfigs.RATE_LIMIT_MAX_REQUESTS,
    windowMs: appConfigs.RATE_LIMIT_WINDOW_MS
}));

app.get("/health", (req, res) => createHealthRestController().healthCheck(req, res));

app.get("/short-url/:key",
    withZodValidation(ShortUrlGetParamsZodObject, req => req.params),
    withScopedShortUrlService(prisma),
    async (req: RequestWithParams<ShortUrlGetRequestParams>, res) =>
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

