import createRedirectController from "../../../src/controllers/redirect.controller";
import { HttpError } from "@url-shortner/http";
import { createMockedRedisService } from "@url-shortner/tests";

const _createMockHttpClient = () => ({
    getOriginalUrlFromShortLink: vi.fn(),
});

const _createMocks = () => {
    const httpClient = _createMockHttpClient();
    const { service: redisService } = createMockedRedisService();

    const redirect = vi.fn();
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ redirect, json });

    const req = {
        params: { shortCode: "abc123xyz" },
        requestId: "req-1",
    } as any;

    const res = {
        status,
    } as any;

    return {
        controller: createRedirectController({
            httpClient: httpClient as any,
            redisService: redisService as any,
        }),
        httpClient,
        redisService,
        req,
        res,
        redirect,
        json,
        status,
    };
};

describe("Redirect Controller", () => {
    it("should redirect from cache when cached URL exists", async () => {
        //Arrange
        const { controller, httpClient, redisService, req, res, status, redirect } = _createMocks();
        redisService.get.mockResolvedValue("https://cached.example.com");

        //Act
        await controller.redirect(req, res);

        //Assert
        expect(redisService.get).toHaveBeenCalledWith("shortlink:abc123xyz");
        expect(httpClient.getOriginalUrlFromShortLink).not.toHaveBeenCalled();
        expect(redisService.set).not.toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith(302);
        expect(redirect).toHaveBeenCalledWith("https://cached.example.com");
    });

    it("should fetch, cache and redirect when cache is missing", async () => {
        //Arrange
        const { controller, httpClient, redisService, req, res, status, redirect } = _createMocks();
        redisService.get.mockResolvedValue(null);
        httpClient.getOriginalUrlFromShortLink.mockResolvedValue({
            originalUrl: "https://origin.example.com",
        });

        //Act
        await controller.redirect(req, res);

        //Assert
        expect(httpClient.getOriginalUrlFromShortLink).toHaveBeenCalledWith({
            key: "abc123xyz",
            "x-request-id": "req-1",
        });
        expect(redisService.set).toHaveBeenCalledWith("shortlink:abc123xyz", "https://origin.example.com");
        expect(status).toHaveBeenCalledWith(302);
        expect(redirect).toHaveBeenCalledWith("https://origin.example.com");
    });

    it("should return 404 payload when upstream responds with HttpError 404", async () => {
        //Arrange
        const { controller, httpClient, redisService, req, res, status, json } = _createMocks();
        redisService.get.mockResolvedValue(null);
        httpClient.getOriginalUrlFromShortLink.mockRejectedValue(
            new HttpError("/short-url/abc123xyz", { status: 404 } as Response)
        );

        //Act
        await controller.redirect(req, res);

        //Assert
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: "Not Found" });
    });

    it("should rethrow non-404 errors", async () => {
        //Arrange
        const { controller, httpClient, redisService, req, res } = _createMocks();
        const error = new Error("Unexpected upstream failure");
        redisService.get.mockResolvedValue(null);
        httpClient.getOriginalUrlFromShortLink.mockRejectedValue(error);

        //Act & Assert
        await expect(controller.redirect(req, res)).rejects.toBe(error);
    });
});
