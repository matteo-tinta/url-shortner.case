import { ZodAny, ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

const withZodValidation = (schema: ZodObject) => {
    const validate = (req: Request, res: Response, next: NextFunction) => {
        const validationResult = schema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                error: "Invalid request payload",
                details: validationResult.error,
            });
        }

        next();
    }

    return validate;
}

export default withZodValidation;