import z from "zod";

export const ShortUrlCreatePayloadZodObject = z.object({
    originalUrl: z.url(),
});

export type ShortUrlCreatePayload = z.infer<typeof ShortUrlCreatePayloadZodObject>;

export const ShortUrlGetParamsZodObject = z.object({
    key: z.string().min(6).max(6),
});

export type ShortUrlGetRequestParams = z.infer<typeof ShortUrlGetParamsZodObject>;