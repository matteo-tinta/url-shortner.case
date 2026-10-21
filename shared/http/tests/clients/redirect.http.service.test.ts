import createRedirectHttpClient from "../../src/clients/redirect.http.service";

const _createMockFetch = () => vi.fn();

const _createOkResponse = () => ({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: vi.fn().mockResolvedValue({ ok: true }),
});

const _createErrorResponse = (status: number) => ({
    ok: false,
    status,
    headers: { get: () => "application/json" },
    json: vi.fn().mockResolvedValue({}),
    url: "/cache",
});

describe("RedirectHttpClient", () => {
    describe("populateCache", () => {
        it("should call POST /cache with correct JSON body", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createRedirectHttpClient({ fetch: mockFetch as any });
            mockFetch.mockResolvedValue(_createOkResponse());

            //Act
            await client.populateCache({ key: "abc123456", originalUrl: "https://example.com" });

            //Assert
            expect(mockFetch).toHaveBeenCalledWith(
                "/cache",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ key: "abc123456", originalUrl: "https://example.com" }),
                    headers: expect.objectContaining({ "Content-Type": "application/json" }),
                })
            );
        });

        it("should throw when key is too short", async () => {
            //Arrange
            const client = createRedirectHttpClient({ fetch: vi.fn() as any });

            //Act & Assert
            await expect(
                client.populateCache({ key: "short", originalUrl: "https://example.com" })
            ).rejects.toThrow();
        });

        it("should throw when key is too long", async () => {
            //Arrange
            const client = createRedirectHttpClient({ fetch: vi.fn() as any });

            //Act & Assert
            await expect(
                client.populateCache({ key: "toolongkeyvalue", originalUrl: "https://example.com" })
            ).rejects.toThrow();
        });

        it("should throw HttpError on non-200 response", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createRedirectHttpClient({ fetch: mockFetch as any });
            mockFetch.mockResolvedValue(_createErrorResponse(503));

            //Act & Assert
            await expect(
                client.populateCache({ key: "abc123456", originalUrl: "https://example.com" })
            ).rejects.toThrow();
        });

        it("should include Authorization and X-Service-Id headers when token provider is configured", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createRedirectHttpClient({
                fetch: mockFetch as any,
                getServiceToken: async () => "jwt-token",
                serviceId: "persistence-service",
            });
            mockFetch.mockResolvedValue(_createOkResponse());

            //Act
            await client.populateCache({ key: "abc123456", originalUrl: "https://example.com" });

            //Assert
            expect(mockFetch).toHaveBeenCalledWith(
                "/cache",
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer jwt-token",
                        "X-Service-Id": "persistence-service",
                    }),
                })
            );
        });
    });
});
