import healthRestFactory from "../../../src/controllers/health.controller";

describe("Health REST Controller", () => {
    const controller = healthRestFactory();

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("health check returns ok", () => {
        controller.healthCheck({} as any, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ status: "ok" });
    });
})

