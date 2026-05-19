import z from "zod";

const configSchema = z.object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(30),
    PORT: z.string().regex(/^\d+$/).transform(Number).default(4000),
});

export type Config = z.infer<typeof configSchema>;
export type ConfigServiceFactory = typeof _factory;
export type ConfigService = ReturnType<ConfigServiceFactory>;

const _factory = (env: NodeJS.ProcessEnv) => {
    const getConfig = () => {
        const parsedConfig = configSchema.safeParse(env);

        if (!parsedConfig.success) {
            console.error("Invalid configuration:", parsedConfig.error.format());
            throw new Error("Invalid configuration");
        }

        return parsedConfig.data as Config;
    }

    return {
        getConfig
    }
}

export default _factory;