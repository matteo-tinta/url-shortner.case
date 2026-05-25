import z from "zod";

export type RedirectRequestParams = z.infer<typeof RedirectRequestParamsZodObject>;

export const RedirectRequestParamsZodObject = z.object({
    shortCode: z.string().min(1, "Short code is required")
});

// 