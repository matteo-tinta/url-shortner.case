import request from "supertest";
import { describe, expect, it } from "vitest";

describe("GET /health", () => {
    //INTEGRATION TEST - SKIPPED FOR NOW
    it.skip("returns 200 with status ok", async () => {
        const { default: app } = await import("../../src/app");
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });
});
