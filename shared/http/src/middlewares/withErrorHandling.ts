import { Request, Response, NextFunction } from "express";

const _factory = (opt?: {
    errorHandler: (_err: any, _req: Request, _res: Response) => void
}) => {
    const _defaultErrorHandler = (error: any, _req: Request, res: Response) => {
        console.error("An unexpected error occurred:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

    const { errorHandler = _defaultErrorHandler } = opt || {};

    const withErrorHandling = (err: any, req: Request, res: Response, next: NextFunction) => {
        try {
            errorHandler(err, req, res);
        } catch (handlerErr) {
            next(handlerErr);
        }
    }

    return {
        withErrorHandling
    }
}

export default _factory;