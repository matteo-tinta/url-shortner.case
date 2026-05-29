import createWithServiceAuthenticationMiddleware from "../../src/middlewares/withServiceAuthentication";
import { expressMockFactory, createMockedLogger } from "@url-shortner/tests";

const joseMocks = vi.hoisted(() => ({
    decodeProtectedHeader: vi.fn(),
    importSPKI: vi.fn(),
    jwtVerify: vi.fn(),
    decodeJwt: vi.fn(),
}));

vi.mock("jose", () => ({
    decodeProtectedHeader: joseMocks.decodeProtectedHeader,
    importSPKI: joseMocks.importSPKI,
    jwtVerify: joseMocks.jwtVerify,
    decodeJwt: joseMocks.decodeJwt,
}));

const _createMockMeter = () => {
    const authRequestsCounter = { add: vi.fn() };
    const authFailuresCounter = { add: vi.fn() };

    return {
        meter: {
            createCounter: vi
                .fn()
                .mockReturnValueOnce(authRequestsCounter)
                .mockReturnValueOnce(authFailuresCounter),
        },
        authRequestsCounter,
        authFailuresCounter,
    };
};

describe("withServiceAuthentication", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when bearer token is missing", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: { headers: {}, path: "/cache" },
        });
        const { meter, authFailuresCounter } = _createMockMeter();

        const middleware = createWithServiceAuthenticationMiddleware({
            logger: createMockedLogger() as any,
            meter: meter as any,
            issuerHttpClient: { getPublicKey: vi.fn() } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
            allowedCallers: ["persistence-service"],
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        expect(authFailuresCounter.add).toHaveBeenCalledWith(1, { reason: "bad_claims" });
    });

    it("calls next and sets serviceAuth for valid token", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: {
                headers: {
                    authorization: "Bearer token",
                    "x-service-id": "persistence-service",
                },
                path: "/cache",
            },
        });
        const { meter, authRequestsCounter } = _createMockMeter();

        joseMocks.decodeProtectedHeader.mockReturnValue({ kid: "v1" });
        joseMocks.importSPKI.mockResolvedValue("imported-key");
        joseMocks.jwtVerify.mockResolvedValue({
            payload: {
                iss: "issuer-service",
                aud: "redirect-service",
                sub: "persistence-service",
                iat: 100,
                exp: 200,
                jti: "token-id",
            },
        });

        const middleware = createWithServiceAuthenticationMiddleware({
            logger: createMockedLogger() as any,
            meter: meter as any,
            issuerHttpClient: {
                getPublicKey: vi.fn().mockResolvedValue({ kid: "v1", publicKey: "pem" }),
            } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
            allowedCallers: ["persistence-service"],
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).toHaveBeenCalled();
        expect(req.serviceAuth).toEqual({
            sub: "persistence-service",
            iss: "issuer-service",
            aud: "redirect-service",
            jti: "token-id",
            kid: "v1",
        });
        expect(authRequestsCounter.add).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ status: "ok", outcome: "success" })
        );
    });

    it("returns 403 when x-service-id does not match token subject", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: {
                headers: {
                    authorization: "Bearer token",
                    "x-service-id": "other-service",
                },
                path: "/cache",
            },
        });
        const { meter, authFailuresCounter } = _createMockMeter();

        joseMocks.decodeProtectedHeader.mockReturnValue({ kid: "v1" });
        joseMocks.importSPKI.mockResolvedValue("imported-key");
        joseMocks.jwtVerify.mockResolvedValue({
            payload: {
                iss: "issuer-service",
                aud: "redirect-service",
                sub: "persistence-service",
                iat: 100,
                exp: 200,
                jti: "token-id",
            },
        });

        const middleware = createWithServiceAuthenticationMiddleware({
            logger: createMockedLogger() as any,
            meter: meter as any,
            issuerHttpClient: {
                getPublicKey: vi.fn().mockResolvedValue({ kid: "v1", publicKey: "pem" }),
            } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
            allowedCallers: ["persistence-service"],
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
        expect(authFailuresCounter.add).toHaveBeenCalledWith(1, { reason: "policy_denied" });
    });

    it("returns 401 for expired token", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: {
                headers: { authorization: "Bearer token", path: "/cache" },
            },
        });
        const { meter, authFailuresCounter } = _createMockMeter();

        joseMocks.decodeProtectedHeader.mockReturnValue({ kid: "v1" });
        joseMocks.importSPKI.mockResolvedValue("imported-key");
        joseMocks.decodeJwt.mockReturnValue({ sub: "test-service" });
        const expiredError = new Error("JWT is expired");
        (expiredError as any).code = "ERR_JWT_EXPIRED";
        joseMocks.jwtVerify.mockRejectedValue(expiredError);

        const mockLogger = createMockedLogger();
        const middleware = createWithServiceAuthenticationMiddleware({
            logger: mockLogger as any,
            meter: meter as any,
            issuerHttpClient: {
                getPublicKey: vi.fn().mockResolvedValue({ kid: "v1", publicKey: "pem" }),
            } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(authFailuresCounter.add).toHaveBeenCalledWith(1, { reason: "expired" });
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ caller_service: "test-service" }),
            "auth.failed"
        );
    });

    it("returns 401 for invalid signature", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: {
                headers: { authorization: "Bearer token", path: "/cache" },
            },
        });
        const { meter, authFailuresCounter } = _createMockMeter();

        joseMocks.decodeProtectedHeader.mockReturnValue({ kid: "v1" });
        joseMocks.importSPKI.mockResolvedValue("imported-key");
        joseMocks.decodeJwt.mockReturnValue({ sub: "test-service" });
        const sigError = new Error("Signature verification failed");
        (sigError as any).code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
        joseMocks.jwtVerify.mockRejectedValueOnce(sigError);
        joseMocks.jwtVerify.mockRejectedValueOnce(sigError);

        const getPublicKeyMock = vi.fn().mockResolvedValue({ kid: "v1", publicKey: "pem" });
        const mockLogger = createMockedLogger();
        const middleware = createWithServiceAuthenticationMiddleware({
            logger: mockLogger as any,
            meter: meter as any,
            issuerHttpClient: { getPublicKey: getPublicKeyMock } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(authFailuresCounter.add).toHaveBeenCalledWith(1, { reason: "invalid_signature" });
        expect(getPublicKeyMock).toHaveBeenCalledTimes(2);
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ caller_service: "test-service" }),
            "auth.failed"
        );
    });

    it("returns 401 for bad claims (missing required field)", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: {
                headers: { authorization: "Bearer token", path: "/cache" },
            },
        });
        const { meter, authFailuresCounter } = _createMockMeter();

        joseMocks.decodeProtectedHeader.mockReturnValue({ kid: "v1" });
        joseMocks.importSPKI.mockResolvedValue("imported-key");
        joseMocks.decodeJwt.mockReturnValue({ sub: "persistence-service" });
        joseMocks.jwtVerify.mockResolvedValue({
            payload: {
                iss: "issuer-service",
                aud: "redirect-service",
                sub: "persistence-service",
                iat: 100,
                exp: 200,
                // missing jti
            },
        });

        const mockLogger = createMockedLogger();
        const middleware = createWithServiceAuthenticationMiddleware({
            logger: mockLogger as any,
            meter: meter as any,
            issuerHttpClient: {
                getPublicKey: vi.fn().mockResolvedValue({ kid: "v1", publicKey: "pem" }),
            } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(authFailuresCounter.add).toHaveBeenCalledWith(1, { reason: "bad_claims" });
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({ caller_service: "persistence-service" }),
            "auth.failed"
        );
    });

    it("returns 403 for allowedCallers mismatch", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: {
                headers: { authorization: "Bearer token", path: "/cache" },
            },
        });
        const { meter, authFailuresCounter } = _createMockMeter();

        joseMocks.decodeProtectedHeader.mockReturnValue({ kid: "v1" });
        joseMocks.importSPKI.mockResolvedValue("imported-key");
        joseMocks.jwtVerify.mockResolvedValue({
            payload: {
                iss: "issuer-service",
                aud: "redirect-service",
                sub: "unknown-service",
                iat: 100,
                exp: 200,
                jti: "token-id",
            },
        });

        const middleware = createWithServiceAuthenticationMiddleware({
            logger: createMockedLogger() as any,
            meter: meter as any,
            issuerHttpClient: {
                getPublicKey: vi.fn().mockResolvedValue({ kid: "v1", publicKey: "pem" }),
            } as any,
            expectedIss: "issuer-service",
            expectedAud: "redirect-service",
            allowedCallers: ["persistence-service"],
        }).withServiceAuthentication;

        //Act
        await middleware(req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(authFailuresCounter.add).toHaveBeenCalledWith(1, { reason: "policy_denied" });
    });
});
