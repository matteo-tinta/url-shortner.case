import { Request, Response, NextFunction } from "express";

const _factory = (opt?: {
    errorHandler: (err: any, req: Request, res: Response) => void
}) => {
    const _defaultErrorHandler = (error: any, req: Request, res: Response) => {
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