import z from "zod";

export const configSchema = z.object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    REDIRECT_API_BASE_URL: z.url(),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default(30),
    PORT: z.string().regex(/^\d+$/).transform(Number).default(4000),
});

export type Config = z.infer<typeof configSchema>;
