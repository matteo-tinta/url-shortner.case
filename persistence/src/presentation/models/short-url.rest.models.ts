import z from "zod";

export const ShortUrlCreatePayloadZodObject = z.object({
    originalUrl: z.url(),
});

export type ShortUrlCreatePayload = z.infer<typeof ShortUrlCreatePayloadZodObject>;