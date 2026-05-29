import cors from "cors";
import express from "express";
import { createWithErrorHandlingMiddleware } from "@url-shortner/http";
import createAuthController from "./controllers/auth.controller";
import { tokenIssuerService, withObservability, withTokenRequestValidation } from "./composition";

const app = express();
const authController = createAuthController({ tokenIssuerService });

const { withErrorHandling } = createWithErrorHandlingMiddleware();

app.use(
    cors(),
    express.json(),
    withObservability(),
);

app.post("/auth/token", withTokenRequestValidation, authController.issueToken);
app.get("/auth/public-key", authController.getPublicKey);

app.use(withErrorHandling);

export default app;
