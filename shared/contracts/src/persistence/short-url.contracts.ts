import z from "zod";

//X-REQUEST-ID MODEL
export const RequestIdHeaderZodObject = z.object({
    ["x-request-id"]: z.string()
})

export type RequestIdHeader = z.infer<typeof RequestIdHeaderZodObject>;

//IDEMPOTENCY REQUEST HEADERS MODEL
export const IdempotentRequestHeadersZodObject = RequestIdHeaderZodObject.extend(z.object({
    ["idempotency-key"]: z.string()
}).shape);

export type IdempotentRequest = z.infer<typeof IdempotentRequestHeadersZodObject>

// ── Short URL key ────────────────────────────────────────────────────────────

export const ShortUrlKeyZodObject = RequestIdHeaderZodObject.extend(z.object({
    key: z.string().min(9).max(11), //Kl6piB89OOv
}).shape);

export type ShortUrlKey = z.infer<typeof ShortUrlKeyZodObject>;

// ── GET /short-link/:key — response returned by persistence, consumed by redirect ──

export const ShortUrlResponseZodObject = z.object({
    originalUrl: z.url(),
});

export type ShortUrlResponse = z.infer<typeof ShortUrlResponseZodObject>;

// ── POST /short-link — request payload accepted by persistence ───────────────

export const ShortUrlCreatePayloadZodObject = z.object({
    originalUrl: z.url(),
});

export type ShortUrlCreatePayload = z.infer<typeof ShortUrlCreatePayloadZodObject>;


