import cors from "cors";
import express from "express";

import createRedirectController from "./controllers/redirect.controller";
import createRedirectCacheService from "./core/redirect-cache.service";
import { createWithErrorHandlingMiddleware, createWithObservability, withZodValidation, RequestWithBody } from "@url-shortner/http";
import { CacheWritePayload, CacheWritePayloadZodObject } from "@url-shortner/contracts";
import createWithConcurrentLimitingMiddleware from "./middlewares/withConcurrentLimiting";
import createMutex from "./core/mutex.service";
import { logger, meter, persistenceHttpClient, redisService } from "./composition";
import { Request, Response } from "express";

import { default as withRedirectRequestParamsValidation } from "./middlewares/request-validation/withRedirectRequestParamsValidation";

const mutex = createMutex({ timeoutMs: 5000, maxConcurrent: 5 });
const { withConcurrentLimiting } = createWithConcurrentLimitingMiddleware({ mutex });

const withObservability = createWithObservability({
    logger: logger.logger,
    meter: meter,
});

const cacheService = createRedirectCacheService(redisService);

const redirectController = createRedirectController({
    httpClient: persistenceHttpClient,
    cacheService,
});

const { withErrorHandling } = createWithErrorHandlingMiddleware({
    errorHandler: (err: any, req: Request, res: Response) => {
        mutex.release();

        logger.logger.error("An unexpected error occurred:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const app = express();

app.use(cors(), express.json());

app.post("/cache",
    withObservability(),
    // TODO: add api authorization with header middleware
    withZodValidation({ schema: CacheWritePayloadZodObject, logger: logger.logger, selector: (req) => req.body }),
    async (req: RequestWithBody<CacheWritePayload>, res) => {
        await cacheService.setInCache(req.body.key, req.body.originalUrl);
        res.status(200).json({ ok: true });
    }
);

app.get("/:shortCode",
    withObservability(),
    withRedirectRequestParamsValidation({ logger: logger.logger }),
    withConcurrentLimiting(),
    redirectController.redirect
);

app.use(withErrorHandling);

export default app;
