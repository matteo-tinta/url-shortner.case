import createIssuerTokenService from "../../src/core/issuer-token.service";

describe("IssuerTokenService", () => {
    it("should fetch a token on first call", async () => {
        //Arrange
        const requestToken = vi.fn().mockResolvedValue({ token: "first", expiresAt: 200 });
        const service = createIssuerTokenService({
            requestToken,
            sub: "redirect-service",
            aud: "persistence-service",
            now: () => 100,
            refreshSkewSeconds: 10,
        });

        //Act
        const token = await service.getToken();

        //Assert
        expect(token).toBe("first");
        expect(requestToken).toHaveBeenCalledTimes(1);
    });

    it("should reuse cached token when not close to expiry", async () => {
        //Arrange
        const requestToken = vi.fn().mockResolvedValue({ token: "first", expiresAt: 200 });
        const service = createIssuerTokenService({
            requestToken,
            sub: "redirect-service",
            aud: "persistence-service",
            now: () => 100,
            refreshSkewSeconds: 10,
        });

        await service.getToken();

        //Act
        const token = await service.getToken();

        //Assert
        expect(token).toBe("first");
        expect(requestToken).toHaveBeenCalledTimes(1);
    });

    it("should refresh token when close to expiry", async () => {
        //Arrange
        const requestToken = vi
            .fn()
            .mockResolvedValueOnce({ token: "first", expiresAt: 200 })
            .mockResolvedValueOnce({ token: "second", expiresAt: 400 });

        let now = 100;

        const service = createIssuerTokenService({
            requestToken,
            sub: "redirect-service",
            aud: "persistence-service",
            now: () => now,
            refreshSkewSeconds: 30,
        });

        await service.getToken();
        now = 180;

        //Act
        const token = await service.getToken();

        //Assert
        expect(token).toBe("second");
        expect(requestToken).toHaveBeenCalledTimes(2);
    });

    it("should deduplicate concurrent token refreshes", async () => {
        //Arrange
        let resolver: ((_value: { token: string; expiresAt: number }) => void) | undefined;
        const requestToken = vi.fn().mockImplementation(() => new Promise(resolve => {
            resolver = resolve;
        }));

        const service = createIssuerTokenService({
            requestToken,
            sub: "redirect-service",
            aud: "persistence-service",
            now: () => 100,
            refreshSkewSeconds: 10,
        });

        const first = service.getToken();
        const second = service.getToken();

        //Act
        resolver!({ token: "shared", expiresAt: 200 });
        const [firstToken, secondToken] = await Promise.all([first, second]);

        //Assert
        expect(firstToken).toBe("shared");
        expect(secondToken).toBe("shared");
        expect(requestToken).toHaveBeenCalledTimes(1);
    });

    it("should retry on 401 and clear cached token", async () => {
        //Arrange
        const requestToken = vi
            .fn()
            .mockResolvedValueOnce({ token: "stale-token", expiresAt: 200 })
            .mockResolvedValueOnce({ token: "fresh-token", expiresAt: 300 });
        const service = createIssuerTokenService({
            requestToken,
            sub: "redirect-service",
            aud: "persistence-service",
            now: () => 100,
            refreshSkewSeconds: 10,
        });

        await service.getToken();

        const call = vi
            .fn()
            .mockResolvedValueOnce({ status: 401, body: "Unauthorized" })
            .mockResolvedValueOnce({ status: 200, body: "Success" });

        //Act
        const result = await service.withRetryOnUnauthorized(call);

        //Assert
        expect(result.status).toBe(200);
        expect(call).toHaveBeenCalledTimes(2);
        expect(call).toHaveBeenNthCalledWith(1, "stale-token");
        expect(call).toHaveBeenNthCalledWith(2, "fresh-token");
    });
});
