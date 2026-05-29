import createIssuerHttpClient from "../../src/clients/issuer.http.service";

const _createMockFetch = () => vi.fn();

const _createJsonResponse = (jsonData: unknown) => ({
    ok: true,
    status: 200,
    headers: {
        get: () => "application/json",
    },
    json: vi.fn().mockResolvedValue(jsonData),
});

describe("IssuerHttpClient", () => {
    it("should fetch /auth/public-key", async () => {
        //Arrange
        const mockFetch = _createMockFetch();
        const client = createIssuerHttpClient({ fetch: mockFetch as any });
        mockFetch.mockResolvedValue(_createJsonResponse({ kid: "v1", publicKey: "public-key" }));

        //Act
        const response = await client.getPublicKey();

        //Assert
        expect(response).toEqual({ kid: "v1", publicKey: "public-key" });
        expect(mockFetch).toHaveBeenCalledWith(
            "/auth/public-key",
            expect.objectContaining({ method: "GET" })
        );
    });

    it("should post /auth/token", async () => {
        //Arrange
        const mockFetch = _createMockFetch();
        const client = createIssuerHttpClient({ fetch: mockFetch as any });
        mockFetch.mockResolvedValue(_createJsonResponse({ token: "jwt", expiresAt: 123 }));

        //Act
        const response = await client.requestToken({ sub: "redirect-service", aud: "persistence-service" });

        //Assert
        expect(response).toEqual({ token: "jwt", expiresAt: 123 });
        expect(mockFetch).toHaveBeenCalledWith(
            "/auth/token",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ sub: "redirect-service", aud: "persistence-service" }),
            })
        );
    });
});
