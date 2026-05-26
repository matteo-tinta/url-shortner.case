import createHttpClient from "../../src/clients/http-client.service";
import { HttpError } from "../../src/errors/http.errors";
import { z } from "zod";

const _createMockFetch = () => vi.fn();

const _createMockResponse = (opts: {
    ok?: boolean;
    status?: number;
    contentType?: string;
    jsonData?: unknown;
}) => ({
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: {
        get: (key: string) => key === "Content-Type" ? (opts.contentType ?? "application/json") : null,
    },
    json: vi.fn().mockResolvedValue(opts.jsonData ?? {}),
});

describe("HttpClient", () => {
    describe("get", () => {
        it("should make a GET request to the given URL", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createHttpClient({ fetch: mockFetch as any });
            mockFetch.mockResolvedValue(_createMockResponse({}));

            //Act
            await client.get("http://example.com/test");

            //Assert
            expect(mockFetch).toHaveBeenCalledWith(
                "http://example.com/test",
                expect.objectContaining({ method: "GET" })
            );
        });

        it("should include X-Request-Id header when requestId is provided", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createHttpClient({ fetch: mockFetch as any });
            mockFetch.mockResolvedValue(_createMockResponse({}));

            //Act
            await client.get("http://example.com/test", { requestId: "req-abc-123" });

            //Assert
            expect(mockFetch).toHaveBeenCalledWith(
                "http://example.com/test",
                expect.objectContaining({
                    headers: expect.objectContaining({ "X-Request-Id": "req-abc-123" }),
                })
            );
        });

        it("should throw HttpError with the response status code", async () => {
            //Arrange
            const mockFetch = _createMockFetch();
            const client = createHttpClient({ fetch: mockFetch as any });
            mockFetch.mockResolvedValue(_createMockResponse({ ok: false, status: 503 }));

            //Act & Assert
            const error = await client.get("http://example.com/unavailable").catch(e => e);
            expect(error).toBeInstanceOf(HttpError);
            expect((error as HttpError).status).toBe(503);
        });
    });

    describe("validateResponseAsJsonAndReturn", () => {
        it("should throw if Content-Type is not application/json", async () => {
            //Arrange
            const client = createHttpClient({ fetch: vi.fn() as any });
            const response = _createMockResponse({ contentType: "text/html" }) as unknown as Response;

            //Act & Assert
            await expect(
                client.validateResponseAsJsonAndReturn(response, z.object({ name: z.string() }))
            ).rejects.toThrow("Expected JSON response");
        });

        it("should parse and validate the JSON response against the schema", async () => {
            //Arrange
            const client = createHttpClient({ fetch: vi.fn() as any });
            const schema = z.object({ name: z.string() });
            const response = _createMockResponse({ jsonData: { name: "test" } }) as unknown as Response;

            //Act
            const result = await client.validateResponseAsJsonAndReturn(response, schema);

            //Assert
            expect(result).toEqual({ name: "test" });
        });

        it("should throw if JSON response does not match schema", async () => {
            //Arrange
            const client = createHttpClient({ fetch: vi.fn() as any });
            const schema = z.object({ name: z.string() });
            const response = _createMockResponse({ jsonData: { name: 42 } }) as unknown as Response;

            //Act & Assert
            await expect(
                client.validateResponseAsJsonAndReturn(response, schema)
            ).rejects.toThrow();
        });
    });
});
