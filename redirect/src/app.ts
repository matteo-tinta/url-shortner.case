import cors from "cors";
import express from "express";

import createRedirectController from "./controllers/redirect.controller";
import { createWithErrorHandlingMiddleware, createWithObservability } from "@url-shortner/http";
import createWithConcurrentLimitingMiddleware from "./middlewares/withConcurrentLimiting";
import createMutex from "./core/mutex.service";
import { logger, meter, persistenceHttpClient, redisService } from "./composition";
import { Request, Response } from "express";

import { default as withRedirectRequestParamsValidation } from "./middlewares/request-validation/withRedirectRequestParamsValidation";

const mutex = createMutex({ timeoutMs: 5000, maxConcurrent: 5 });
const { withConcurrentLimiting } = createWithConcurrentLimitingMiddleware({
    mutex: mutex
})

const withObservability = createWithObservability({
    logger: logger.logger,
    meter: meter,
})

const redirectController = createRedirectController({
    httpClient: persistenceHttpClient,
    redisService: redisService
});

//creating express middlewares
const { withErrorHandling } = createWithErrorHandlingMiddleware({
    errorHandler: (err: any, req: Request, res: Response) => {
        mutex.release();

        logger.logger.error("An unexpected error occurred:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const app = express();

app.use(cors(), express.json());

app.get("/:shortCode",
    withObservability(),
    withRedirectRequestParamsValidation({
        logger: logger.logger
    }),
    withConcurrentLimiting(),
    redirectController.redirect
)


app.use(withErrorHandling);

export default app;

