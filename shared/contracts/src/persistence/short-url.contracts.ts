import z from "zod";

//IDEMPOTENCY REQUEST HEADERS MODEL
export const IdempotentRequestHeadersZodObject = z.object({
    ["idempotency-key"]: z.string()
})

export type IdempotentRequest = z.infer<typeof IdempotentRequestHeadersZodObject>

// ── Short URL key ────────────────────────────────────────────────────────────

export const ShortUrlKeyZodObject = z.object({
    key: z.string().min(11).max(11), //Kl6piB89OOv
});

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


