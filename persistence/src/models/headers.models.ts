import z from "zod"

//IDEMPOTENCY REQUEST HEADERS MODEL
export const IdempotentRequestHeadersZodObject = z.object({
    ["idempotency-key"]: z.string()
})

export type IdempotentRequest = z.infer<typeof IdempotentRequestHeadersZodObject>

//IDEMPOTENCY RESULT MODEL
export const IdempotencyResultSchema = z.object({
    statusCode: z.number(),
    body: z.any()
})

export type IdempotencyResult = z.infer<typeof IdempotencyResultSchema>;