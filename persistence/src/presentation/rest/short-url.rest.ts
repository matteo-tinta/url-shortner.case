import { Request, Response } from 'express';
import { ShortUrlCreatePayload } from '../models/short-url.rest.models';

const _factory = (
    service: ReturnType<typeof import("../../core/shortner-url.service").default>
) => {
    if (!service) {
        throw new Error("ShortUrlService is required");
    }

    const createShortUrl = async (body: ShortUrlCreatePayload) => {
        const key = await service.generateShortUrl(body.originalUrl);
        return key;
    }

    return {
        createShortUrl
    };
}

export default _factory;