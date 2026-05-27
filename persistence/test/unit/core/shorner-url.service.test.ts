import createShortnerUrlFactory from "../../../src/core/shortner-url.service";
import { PrismaClient } from "../../../src/persistence/prisma/generated/client";

const _createMocks = () => {
    const mockPrismaClient: PrismaClient = {
        shortnedUrl: {
            create: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
    } as unknown as PrismaClient;

    const mockRedirectHttpClient = {
        populateCache: vi.fn().mockResolvedValue(undefined),
    };

    return {
        service: createShortnerUrlFactory(mockPrismaClient, mockRedirectHttpClient as any),
        mockPrismaClient: vi.mocked(mockPrismaClient),
        mockRedirectHttpClient,
    };
};

describe("generateShortUrl", () => {
    it("should write to DB first, then populate cache, and return the key", async () => {
        //Arrange
        const { service, mockPrismaClient, mockRedirectHttpClient } = _createMocks();

        let capturedKey: string | null = null;
        vi.mocked(mockPrismaClient.shortnedUrl).create.mockImplementationOnce((args) => {
            capturedKey = args.data.key;
            return Promise.resolve({ key: capturedKey });
        });

        //Act
        const originalUrl = "https://www.example.com/some/long/url";
        const result = await service.generateShortUrl(originalUrl);

        //Assert
        expect(result).toEqual(capturedKey);
        expect(mockPrismaClient.shortnedUrl.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ url: originalUrl }),
        });
        expect(mockRedirectHttpClient.populateCache).toHaveBeenCalledWith({
            key: capturedKey,
            originalUrl,
        });
    });

    it("should delete DB record and re-throw when populateCache fails", async () => {
        //Arrange
        const { service, mockPrismaClient, mockRedirectHttpClient } = _createMocks();
        let capturedKey: string | null = null;
        vi.mocked(mockPrismaClient.shortnedUrl).create.mockImplementationOnce((args) => {
            capturedKey = args.data.key;
            return Promise.resolve({ key: capturedKey });
        });
        mockRedirectHttpClient.populateCache.mockRejectedValue(new Error("redirect service down"));

        //Act & Assert
        await expect(service.generateShortUrl("https://www.example.com")).rejects.toThrow("redirect service down");
        expect(mockPrismaClient.shortnedUrl.delete).toHaveBeenCalledWith({ where: { key: capturedKey } });
    });

    it("should propagate DB error without calling populateCache", async () => {
        //Arrange
        const { service, mockPrismaClient, mockRedirectHttpClient } = _createMocks();
        vi.mocked(mockPrismaClient.shortnedUrl).create.mockRejectedValue(new Error("db connection lost"));

        //Act & Assert
        await expect(service.generateShortUrl("https://www.example.com")).rejects.toThrow("db connection lost");
        expect(mockRedirectHttpClient.populateCache).not.toHaveBeenCalled();
        expect(mockPrismaClient.shortnedUrl.delete).not.toHaveBeenCalled();
    });
});

it.each([
    {
        returned: (key: string) => ({ key, url: "https://www.example.com/some/long/url", id: 1 }),
        expected: "https://www.example.com/some/long/url",
    },
    { returned: () => null, expected: null },
    { returned: () => undefined, expected: null },
])("getOriginalUrl should retrieve the original URL from the database using the short URL key",
    async ({ returned, expected }) => {
        //Arrange
        const { service, mockPrismaClient } = _createMocks();
        const key = "testKey";

        vi.mocked(mockPrismaClient.shortnedUrl).findUnique
            .mockReturnValueOnce(Promise.resolve(returned(key)) as any);

        //Act
        const result = await service.getOriginalUrl(key);

        //Assert
        expect(result).toEqual(expected);
        expect(mockPrismaClient.shortnedUrl.findUnique).toHaveBeenCalledWith({
            where: expect.objectContaining({ key }),
        });
    });
