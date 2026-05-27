import { PrismaClient } from "../persistence/prisma/generated/client";
import { RedirectHttpClient } from "@url-shortner/http";
import { randomBytes } from "crypto";

export type ShortnerUrlServiceFactory = typeof _factory;
export type ShortnerUrlService = ReturnType<ShortnerUrlServiceFactory>;

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const _factory = (prismaService: PrismaClient, redirectHttpClient: RedirectHttpClient) => {
    const _generateKeyBase62 = (): string => {
        const buffer = randomBytes(8);
        let num = BigInt(0);
        for (let i = 0; i < buffer.length; i++) {
            num = (num << 8n) | BigInt(buffer[i]);
        }

        let result = "";
        while (num > 0n) {
            result = BASE62_CHARS[Number(num % 62n)] + result;
            num = num / 62n;
        }
        return result || "0";
    };

    const generateShortUrl = async (originalUrl: string): Promise<string> => {
        const key = _generateKeyBase62();

        // we ensure max atomicity: DB is written first, then cache. If cache fails, DB is rolled back.
        await prismaService.shortnedUrl.create({ data: { key, url: originalUrl } });
        try {
            await redirectHttpClient.populateCache({ key, originalUrl });
        } catch (err) {
            await prismaService.shortnedUrl.delete({ where: { key } });
            throw err;
        }

        return key;
    };

    const getOriginalUrl = async (key: string): Promise<string | null> => {
        const record = await prismaService.shortnedUrl.findUnique({ where: { key } });
        return record?.url ?? null;
    };

    return { getOriginalUrl, generateShortUrl };
};

export default _factory;
