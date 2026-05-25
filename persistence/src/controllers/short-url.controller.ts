import { Request, Response } from 'express';
import { ShortUrlCreatePayload, ShortUrlKey } from '@url-shortner/contracts';
import { RequestWithBody, RequestWithParams } from '@url-shortner/http';
import { ShortnerUrlService } from '../core/shortner-url.service';

const _factory = (
    service: ShortnerUrlService
) => {
    if (!service) {
        throw new Error("ShortUrlService is required");
    }

    const getShortUrl = async (req: RequestWithParams<ShortUrlKey>, res: Response) => {
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