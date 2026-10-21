import createPersistenceHttpClient from "../../src/clients/persistence.http.service";

const _createMockFetch = () => vi.fn();

const _createJsonResponse = (jsonData: unknown) => ({
    ok: true,
    status: 200,
    headers: {
        get: () => "application/json",
    },
    json: vi.fn().mockResolvedValue(jsonData),
});

describe("PersistenceHttpClient", () => {
    describe("getOriginalUrlFromShortLink", () => {
        it("should call GET /short-url/:key and include X-Request-Id header", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createPersistenceHttpClient({ fetch: mockFetch as any });
            mockFetch.mockResolvedValue(_createJsonResponse({ originalUrl: "https://example.com" }));

            //Act
            await client.getOriginalUrlFromShortLink({
                key: "abc123456",
                "x-request-id": "req-123",
            });

            //Assert
            expect(mockFetch).toHaveBeenCalledWith(
                "/short-url/abc123456",
                expect.objectContaining({
                    method: "GET",
                    headers: expect.objectContaining({ "X-Request-Id": "req-123" }),
                })
            );
        });

        it("should return the validated originalUrl from the response", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createPersistenceHttpClient({ fetch: mockFetch as any });
            const originalUrl = "https://example.com/some/path";
            mockFetch.mockResolvedValue(_createJsonResponse({ originalUrl }));

            //Act
            const result = await client.getOriginalUrlFromShortLink({
                key: "abc123456",
                "x-request-id": "req-123",
            });

            //Assert
            expect(result).toEqual({ originalUrl });
        });

        it("should include Authorization and X-Service-Id headers when token provider is configured", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createPersistenceHttpClient({
                fetch: mockFetch as any,
                getServiceToken: async () => "jwt-token",
                serviceId: "redirect-service",
            });
            mockFetch.mockResolvedValue(_createJsonResponse({ originalUrl: "https://example.com" }));

            //Act
            await client.getOriginalUrlFromShortLink({
                key: "abc123456",
                "x-request-id": "req-123",
            });

            //Assert
            expect(mockFetch).toHaveBeenCalledWith(
                "/short-url/abc123456",
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer jwt-token",
                        "X-Service-Id": "redirect-service",
                    }),
                })
            );
        });

        it.each([
            { key: "short", description: "too short (< 9 chars)" },
            { key: "toolongkeyvalue", description: "too long (> 11 chars)" },
        ])("should throw when key is $description", async ({ key }) => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createPersistenceHttpClient({ fetch: mockFetch as any });

            //Act & Assert
            await expect(
                client.getOriginalUrlFromShortLink({
                    key,
                    "x-request-id": "req-123",
                })
            ).rejects.toThrow();
        });
    });
});
