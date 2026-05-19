import cors from "cors";
import express from "express";

import createHealthRestController from "./presentation/rest/health.rest";
import createShortUrlRestController from "./presentation/rest/short-url.rest";
import withZodValidation from "./presentation/rest/middlewares/withZodValidation";
import createWithRedisMiddleware from "./presentation/rest/middlewares/withRedis";
import createWithMovingWindowRateLimitingMiddleware from './presentation/rest/middlewares/withMovingWindowRateLimiting';
import { withScopedShortUrlService } from "./presentation/rest/middlewares/withScopedService";
import { ShortUrlCreatePayloadZodObject, ShortUrlGetParamsZodObject } from "./presentation/models/short-url.rest.models";
import { client as redisClient, prisma, appConfigs } from "./composition";

//creating express middlewares
const { withRedis } = createWithRedisMiddleware(redisClient);
const { withMovingWindowRateLimiting } = createWithMovingWindowRateLimitingMiddleware({ client: redisClient });

const app = express();

app.use(cors());
app.use(express.json());


//connect to redis
app.use(withRedis);

// Limit to 3 requests per minute per IP
app.use(withMovingWindowRateLimiting({
    limit: appConfigs.RATE_LIMIT_MAX_REQUESTS,
    windowMs: appConfigs.RATE_LIMIT_WINDOW_MS
}));


app.get("/health", () => createHealthRestController().healthCheck);

app.get("/short-url/:key",
    withZodValidation(ShortUrlGetParamsZodObject, req => req.params),
    withScopedShortUrlService(prisma),
    (req) => createShortUrlRestController(req.container?.shortUrlService!).getShortUrl
)

app.post("/short-url",
    withZodValidation(ShortUrlCreatePayloadZodObject, req => req.body),
    withScopedShortUrlService(prisma),
    (req) => createShortUrlRestController(req.container?.shortUrlService!).createShortUrl
)

export default app;
