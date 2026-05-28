import { configure } from "@url-shortner/config";
import { createWithObservability, withZodValidation } from "@url-shortner/http";
import { installObservability } from "@url-shortner/observability";
import { TokenRequestZodObject } from "@url-shortner/contracts";
import createTokenIssuerServiceFactory from "./core/token-issuer.service";
import { configSchema } from "./config";

export const appConfigs = configure(process.env, configSchema).getConfig();

const observability = installObservability({
    env: "development",
    serviceName: "issuer-service",
    serviceVersion: "1.0.0",
});

export const { logger, meter } = observability;

export const tokenIssuerService = createTokenIssuerServiceFactory({
    privateKeyPem: appConfigs.ISSUER_PRIVATE_KEY_PEM,
    publicKeyPem: appConfigs.ISSUER_PUBLIC_KEY_PEM,
    keyId: appConfigs.ISSUER_KEY_ID,
    issuer: appConfigs.AUTH_ISSUER,
    ttlSeconds: appConfigs.TOKEN_TTL_SECONDS,
    logger: logger.logger,
    meter,
});

export const withObservability = createWithObservability({
    logger: logger.logger,
    meter,
});

export const withTokenRequestValidation = withZodValidation({
    schema: TokenRequestZodObject,
    logger: logger.logger,
    selector: req => req.body,
});

export async function initializeIssuer() {
    observability.install();
}

export async function cleanup() {
    await observability.destroy();
}
