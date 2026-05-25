import z from "zod"

//IDEMPOTENCY RESULT MODEL
export const IdempotencyResultSchema = z.object({
    statusCode: z.number(),
    body: z.any()
})

export type IdempotencyResult = z.infer<typeof IdempotencyResultSchema>;