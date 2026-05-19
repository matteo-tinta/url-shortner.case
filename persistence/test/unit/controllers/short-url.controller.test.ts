import shortRestFactory from "../../../src/controllers/short-url.controller";
import { ShortnerUrlService } from "../../../src/core/shortner-url.service";

describe("Short URL REST Controller", () => {
    const service: ShortnerUrlService = {
        getOriginalUrl: vi.fn(),
        generateShortUrl: vi.fn()
    };

    const controller = shortRestFactory(service);

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as any;

    const url = "https://example.com";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getShortUrl returns ok", async () => {
        //Arrange
        vi.mocked(service).getOriginalUrl.mockResolvedValue(url);

        //Act
        await controller.getShortUrl({ params: { key: "abc123" } } as any, res);

        //Assert
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ originalUrl: url });
    });

    it("getShortUrl returns 404 when url returns null", async () => {
        //Arrange
        vi.mocked(service).getOriginalUrl.mockResolvedValue(null);

        //Act
        await controller.getShortUrl({ params: { key: "abc123" } } as any, res);

        //Assert
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: "Short URL not found" });
    });

    it("createShortUrl returns ok", async () => {
        //Arrange
        vi.mocked(service).generateShortUrl.mockResolvedValue("abc123");

        //Act
        await controller.createShortUrl({ body: { url } } as any, res);

        //Assert
        expect(status).toHaveBeenCalledWith(201);
        expect(json).toHaveBeenCalledWith({ key: "abc123" });
    });
})