import { Request, Response, NextFunction } from "express";
import shortUrlServiceServiceFactory, { ShortnerUrlService, ShortnerUrlServiceFactory } from "../core/shortner-url.service";

export type WithScopedServiceFactory<TFactory extends (..._args: any[]) => TService, TService> =
    (_factory: TFactory) =>
        (..._args: Parameters<TFactory>) => ReturnType<typeof withScopedService>;


declare global {
    namespace Express {
        interface Request {
            container?: {
                shortUrlService?: ReturnType<typeof shortUrlServiceServiceFactory>;
            };
        }
    }
}

const withScopedService = (serviceName: string, serviceFactory: (_req: Request) => any) => {
    if (!serviceName) {
        throw new Error("Service name must be provided");
    }

    return (req: Request, res: Response, next: NextFunction) => {

        req.container = {
            ...req.container,
            [serviceName]: serviceFactory(req)
        }

        next();
    }
}

const withScopedShortUrlServiceFactory: WithScopedServiceFactory<ShortnerUrlServiceFactory, ShortnerUrlService> =
    (factory: ShortnerUrlServiceFactory) =>
        (...args: Parameters<ShortnerUrlServiceFactory>) =>
            withScopedService("shortUrlService", () => factory(...args));

export {
    withScopedService,
    withScopedShortUrlServiceFactory,
};