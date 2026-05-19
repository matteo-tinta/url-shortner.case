import { Request, Response } from 'express';
import { ShortUrlCreatePayload, ShortUrlGetRequestParams } from '../models/short-url.rest.models';
import { RequestWithBody, RequestWithParams } from '../models/api.models';

const _factory = (
    service: ReturnType<typeof import("../../core/shortner-url.service").default>
) => {
    if (!service) {
        throw new Error("ShortUrlService is required");
    }

    const getShortUrl = async (req: RequestWithParams<ShortUrlGetRequestParams>, res: Response) => {
        const originalUrl = await service.getOriginalUrl(req.params.key);

        if (originalUrl) {
            res.status(200).json({ originalUrl });
        } else {
            res.status(404).json({ error: "Short URL not found" });
        }
    }

    const createShortUrl = async (req: RequestWithBody<ShortUrlCreatePayload>, res: Response) => {
        const key = await service.generateShortUrl(req.body.originalUrl);
        res.status(201).json({ key });
    }

    return {
        createShortUrl,
        getShortUrl,
    };
}

export default _factory;