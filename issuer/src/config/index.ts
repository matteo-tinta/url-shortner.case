import z from "zod";

export const configSchema = z.object({
    PORT: z.string().regex(/^\d+$/).transform(Number).default(4003),
    AUTH_ISSUER: z.string().min(1),
    TOKEN_TTL_SECONDS: z.string().regex(/^\d+$/).transform(Number).default(180),
    ISSUER_KEY_ID: z.string().min(1).default("v1"),
    ISSUER_PRIVATE_KEY_PEM: z.string().min(1),
    ISSUER_PUBLIC_KEY_PEM: z.string().min(1),
});

export type Config = z.infer<typeof configSchema>;
