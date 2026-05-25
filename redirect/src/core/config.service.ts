import z from "zod";
import { configServiceFactory } from "@url-shortner/services";

const configSchema = z.object({
    PERSISTENCE_API_BASE_URL: z.url(),
    REDIS_URL: z.url(),
    PORT: z.string().regex(/^\d+$/).transform(Number).default(4000),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(30),
});

export type Config = z.infer<typeof configSchema>;
export type ConfigServiceFactory = typeof _factory;

const _factory = (env: NodeJS.ProcessEnv) => {
    const _centralizedConfig = configServiceFactory({
        env,
        schema: configSchema
    });

    return {
        ..._centralizedConfig
    }
}

export default _factory;