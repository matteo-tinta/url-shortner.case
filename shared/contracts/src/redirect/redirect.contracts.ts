import z from "zod";

export type RedirectRequestParams = z.infer<typeof RedirectRequestParamsZodObject>;

export const RedirectRequestParamsZodObject = z.object({
    shortCode: z.string().min(1, "Short code is required")
});

export const CacheWritePayloadZodObject = z.object({
    key: z.string().min(9).max(11),
    originalUrl: z.string().url(),
});

export type CacheWritePayload = z.infer<typeof CacheWritePayloadZodObject>;
