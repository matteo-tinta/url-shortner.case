import { Request, Response, NextFunction } from "express";
import { DefaultPrismaClient } from "../../../persistence/prisma/generated/internal/prismaNamespace";

import shortUrlServiceServiceFactory from "../../../core/shortner-url.service";
import { PrismaClient } from "@prisma/client/extension";

declare global {
    namespace Express {
        interface Request {
            container?: {
                [key: string]: any;
                ["shortUrlService"]?: ReturnType<typeof shortUrlServiceServiceFactory>;
            };
        }
    }
}

const withScopedService = (serviceName: string, serviceFactory: (req: Request) => any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        req.container = {
            ...req.container,
            [serviceName]: serviceFactory(req)
        }

        next();
    }
}

const withScopedShortUrlService = (db: PrismaClient) => withScopedService(
    "shortUrlService",
    () => shortUrlServiceServiceFactory(db));

export {
    withScopedService,
    withScopedShortUrlService,
};