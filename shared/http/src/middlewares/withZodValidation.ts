import { ZodError, ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

const withZodValidation = (schema: ZodObject, selector: (req: Request) => any) => {

    const validate = (req: Request, res: Response, next: NextFunction) => {
        const validationResult = schema.safeParse(selector(req));

        if (!validationResult.success) {
            return res.status(400).json(JSON.parse(validationResult.error.message));
        }

        next();
    }

    return validate;
}

export default withZodValidation;