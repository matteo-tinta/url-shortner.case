import cors from "cors";
import express from "express";

import createHealthRestController from "./presentation/rest/health.rest";
import createShortUrlRestController from "./presentation/rest/short-url.rest";
import withZodValidation from "./presentation/rest/middlewares/withZodValidation";
import { withScopedShortUrlService } from "./presentation/rest/middlewares/withScopedService";
import { ShortUrlCreatePayloadZodObject } from "./presentation/models/short-url.rest.models";
import { prisma } from "./composition";

const app = express();

app.use(cors());
app.use(express.json());


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
