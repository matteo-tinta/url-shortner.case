import request from "supertest";
import { describe, expect, it, beforeAll } from "vitest";
import { importSPKI, jwtVerify } from "jose";

// Test key pair (generated once for tests)
const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIIGlf5GvXUCljq7j9Nt5N2x8LL6AZy2CVe4LvLxCVohT
-----END PRIVATE KEY-----`;

const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQeEb2aKhFD7q6MzXQRxDUW9Y4PBjQZ8rW/n5ZdSyWQI=
-----END PUBLIC KEY-----`;

describe("Issuer app", () => {
    beforeAll(() => {
        // Set environment variables for tests
        process.env.AUTH_ISSUER = "test-issuer";
        process.env.ISSUER_KEY_ID = "test-kid";
        process.env.TOKEN_TTL_SECONDS = "180";
        process.env.ISSUER_PRIVATE_KEY_PEM = TEST_PRIVATE_KEY_PEM;
        process.env.ISSUER_PUBLIC_KEY_PEM = TEST_PUBLIC_KEY_PEM;
    });

    it("returns public key with correct structure", { timeout: 10000 }, async () => {
        const { default: app } = await import("../../src/app");
        const response = await request(app).get("/auth/public-key");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            kid: expect.any(String),
            publicKey: expect.any(String),
        }));
    });

    it("issues token with correct claims in payload", { timeout: 10000 }, async () => {
        const { default: app } = await import("../../src/app");

        const tokenResponse = await request(app)
            .post("/auth/token")
            .send({
                sub: "test-service",
                aud: "other-service",
            });

        expect(tokenResponse.status).toBe(200);
        expect(tokenResponse.body).toEqual(expect.objectContaining({
            token: expect.any(String),
            expiresAt: expect.any(Number),
        }));

        const parts = tokenResponse.body.token.split(".");
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);

        expect(payload).toEqual(expect.objectContaining({
            iss: "test-issuer",
            aud: "other-service",
            sub: "test-service",
            jti: expect.any(String),
            iat: expect.any(Number),
            exp: expect.any(Number),
        }));
    });

    it("returns 400/422 when missing sub field", async () => {
        const { default: app } = await import("../../src/app");
        const response = await request(app)
            .post("/auth/token")
            .send({
                aud: "other-service",
            });

        expect([400, 422]).toContain(response.status);
    });

    it("issued token has kid in protected header", async () => {
        const { default: app } = await import("../../src/app");

        const tokenResponse = await request(app)
            .post("/auth/token")
            .send({
                sub: "test-service",
                aud: "other-service",
            });

        expect(tokenResponse.status).toBe(200);

        const parts = tokenResponse.body.token.split(".");
        const headerJson = Buffer.from(parts[0], "base64").toString("utf-8");
        const header = JSON.parse(headerJson);

        expect(header).toEqual(expect.objectContaining({
            kid: expect.any(String),
            alg: "EdDSA",
        }));

        const publicKeyResponse = await request(app).get("/auth/public-key");
        expect(header.kid).toBe(publicKeyResponse.body.kid);
    });
});
