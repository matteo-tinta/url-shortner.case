import cors from "cors";
import express from "express";

import createHealthRestController from "./presentation/rest/health.rest";
import createShortUrlRestController from "./presentation/rest/short-url.rest";
import withZodValidation from "./presentation/rest/middlewares/withZodValidation";
import { withScopedShortUrlService } from "./presentation/rest/middlewares/withScopedService";
import { ShortUrlCreatePayloadZodObject } from "./presentation/models/short-url.rest.models";
import { prisma } from "./composition";
import { withRedis } from "./presentation/rest/middlewares/withRedis";
import { withMovingWindowRateLimiting } from './presentation/rest/middlewares/withMovingWindowRateLimiting';

const app = express();

app.use(cors());
app.use(express.json());

//connect to redis
app.use(withRedis);

// Limit to 3 requests per minute per IP
app.use(withMovingWindowRateLimiting({
    limit: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100,
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60000
}));


app.get("/health", (req, res) => {
    const healthCheckController = createHealthRestController();
    healthCheckController.healthCheck();
    res.status(200).json({ status: "ok" });
});

app.post("/short-url",
    withZodValidation(ShortUrlCreatePayloadZodObject),
    withScopedShortUrlService(prisma),
    async (req, res) => {
        const shortUrlController = createShortUrlRestController(req.container?.shortUrlService!);
        const key = await shortUrlController.createShortUrl(req.body)
        res.status(201).json({ key });
    })

export default app;
