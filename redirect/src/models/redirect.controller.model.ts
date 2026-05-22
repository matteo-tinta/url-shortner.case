import z from "zod";
import withZodValidation from "../middlewares/withZodValidation";

type RedirectRequestParams = z.infer<typeof redirectRequestParamsZodObject>;

const redirectRequestParamsZodObject = z.object({
    shortCode: z.string().min(1, "Short code is required")
});

const zodValidationMiddleware = () => withZodValidation(redirectRequestParamsZodObject, (req) => req.params);

export {
    zodValidationMiddleware as withRedirectRequestParamsValidation
}