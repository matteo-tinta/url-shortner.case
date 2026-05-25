import cors from "cors";
import express from "express";

import createRedirectController from "./controllers/redirect.controller";
import { createWithErrorHandlingMiddleware } from "@url-shortner/http";
import createWithConcurrentLimitingMiddleware from "./middlewares/withConcurrentLimiting";
import createMutex from "./core/mutex.service";
import { persistenceHttpClient } from "./composition";

import { default as withRedirectRequestParamsValidation } from "./middlewares/request-validation/withRedirectRequestParamsValidation";

const { withConcurrentLimiting } = createWithConcurrentLimitingMiddleware({
    mutex: createMutex({ timeoutMs: 5000, maxConcurrent: 5 })
})

const redirectController = createRedirectController({
    httpClient: persistenceHttpClient
});

//creating express middlewares
const { withErrorHandling } = createWithErrorHandlingMiddleware();

const app = express();

app.use(cors(), express.json());

app.get("/:shortCode",
    withRedirectRequestParamsValidation(),
    withConcurrentLimiting(),
    redirectController.redirect
)


app.use(withErrorHandling);

export default app;

