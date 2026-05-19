import { any, unknown } from "zod";
import createShortnerUrlFactory from "../../../src/core/shortner-url.service";
import { PrismaClient } from "../../../src/persistence/prisma/generated/client";

const _createMocks = () => {
    const mockPrismaClient: PrismaClient = {
        shortnedUrl: {
            create: vi.fn(),
            findUnique: vi.fn(),
        }
    } as unknown as PrismaClient;

    return {
        service: createShortnerUrlFactory(mockPrismaClient),
        mockPrismaClient: vi.mocked(mockPrismaClient),
    };
}

it("generateShortUrl should generate a short url key and store it in the database", async () => {
    //Arrange
    const {
        service,
        mockPrismaClient,
    } = _createMocks();

    let generatedKey: string | null = null;
    vi.mocked(mockPrismaClient.shortnedUrl).create.mockImplementationOnce((args) => {
        generatedKey = args.data.key;
        return Promise.resolve({ shortUrl: generatedKey }) as any;
    })

    //Act
    const originalUrl = "https://www.example.com/some/long/url";
    const result = await service.generateShortUrl(originalUrl);
    //Assert
    expect(result).toEqual(generatedKey);

    expect(mockPrismaClient.shortnedUrl.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ url: originalUrl })
    });
});

it.each([
    {
        returned: (key: string) => ({
            key: key,
            url: "https://www.example.com/some/long/url",
            id: 1
        }), expected: "https://www.example.com/some/long/url"
    },
    {
        returned: () => null, expected: null
    },
    {
        returned: () => undefined, expected: null
    },
])("getOriginalUrl should retrieve the original URL from the database using the short URL key",
    async ({ returned, expected }) => {
        //Arrange
        const {
            service,
            mockPrismaClient,
        } = _createMocks();
        const key = "testKey";

        vi.mocked(mockPrismaClient.shortnedUrl).findUnique
            .mockReturnValueOnce(Promise.resolve(returned(key)) as any)

        //Act
        const result = await service.getOriginalUrl(key);

        //Assert
        expect(result).toEqual(expected);

        expect(mockPrismaClient.shortnedUrl.findUnique).toHaveBeenCalledWith({
            where: expect.objectContaining({ key: key })
        });
    });