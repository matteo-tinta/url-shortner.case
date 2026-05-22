import cors from "cors";
import express from "express";

import createRedirectController from "./controllers/redirect.controller";
import createWithMovingWindowRateLimitingMiddleware from './middlewares/withMovingWindowRateLimiting';
import rateLimitingServiceFactory from "./core/rate-limiting.service";
import createWithErrorHandling from "./middlewares/withErrorHandling";
import { redisClient as redisClient, appConfigs } from "./composition";
import { withRedirectRequestParamsValidation } from "./models/redirect.controller.model";

const redirectController = createRedirectController();

//creating express middlewares
const { withMovingWindowRateLimiting } = createWithMovingWindowRateLimitingMiddleware({
    rateLimitingServiceFactory: rateLimitingServiceFactory(redisClient)
});

const { withErrorHandling } = createWithErrorHandling();

const app = express();

app.use(
    cors(),
    express.json(),
    withMovingWindowRateLimiting({
        limit: appConfigs.RATE_LIMIT_MAX_REQUESTS,
        windowMs: appConfigs.RATE_LIMIT_WINDOW_MS
    }));

app.get("/:shortCode",
    withRedirectRequestParamsValidation(),
    withMovingWindowRateLimiting({
        limit: appConfigs.RATE_LIMIT_MAX_REQUESTS,
        windowMs: appConfigs.RATE_LIMIT_WINDOW_MS
    }),
    redirectController.redirect
)


app.use(withErrorHandling);

export default app;

