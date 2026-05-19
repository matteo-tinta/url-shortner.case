import z from "zod";

const configSchema = z.object({
    DATABASE_URL: z.url(),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(30),
    PORT: z.string().regex(/^\d+$/).transform(Number).default(4000),
});

type Config = z.infer<typeof configSchema>;

const _factory = () => {
    const getConfig = () => {
        const parsedConfig = configSchema.safeParse(process.env);

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