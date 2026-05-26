import { ZodError, ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
import { Logger } from "@url-shortner/observability";

const withZodValidation = (options: {
    schema: ZodObject,
    logger: Logger,
    selector: (req: Request) => any
}) => {

    const validate = (req: Request, res: Response, next: NextFunction) => {
        const validationResult = options.schema.safeParse(options.selector(req));

        if (!validationResult.success) {
            options.logger.error(`Validation failed: ${JSON.stringify(validationResult.error, null, 2)}`);
            return res.status(400).json(JSON.parse(validationResult.error.message));
        }

        next();
    }

    return validate;
}

export default withZodValidation;