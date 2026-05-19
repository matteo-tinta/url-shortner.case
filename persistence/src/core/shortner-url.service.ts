import { Prisma } from "../persistence/prisma/generated/client";

const _factory = (prisma: Prisma.DefaultPrismaClient) => {
    const generateShortUrl = async (originalUrl: string): Promise<string> => {
        //TODO: handle collision (usa SHA256 + base62)
        const key = Math.random().toString(36).substring(2, 8);

        await prisma.shortnedUrl.create({
            data: {
                key: key,
                url: originalUrl
            }
        })

        return key;
    }

    return {
        generateShortUrl
    }
}

export default _factory