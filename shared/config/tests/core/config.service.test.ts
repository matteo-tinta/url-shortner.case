import z from "zod";
import { configure } from "../../src/index";

const testSchema = z.object({
    REQUIRED_VAR: z.string(),
    OPTIONAL_VAR: z.string().default("default-value"),
    NUMERIC_VAR: z.string().regex(/^\d+$/).transform(Number).default(42),
});

const mockEnv: NodeJS.ProcessEnv = {
    REQUIRED_VAR: "hello",
};

const _createService = (overrides: Partial<NodeJS.ProcessEnv> = {}) => {
    return configure({ ...mockEnv, ...overrides }, testSchema);
};

it("returns parsed config with valid environment variables", () => {
    const service = _createService();

    const config = service.getConfig();

    expect(config).toEqual({
        REQUIRED_VAR: "hello",
        OPTIONAL_VAR: "default-value",
        NUMERIC_VAR: 42,
    });
});

it("applies overrides and transforms correctly", () => {
    const service = _createService({ NUMERIC_VAR: "99", OPTIONAL_VAR: "custom" });

    const config = service.getConfig();

    expect(config.NUMERIC_VAR).toBe(99);
    expect(config.OPTIONAL_VAR).toBe("custom");
});

it("throws when a required variable is missing", () => {
    const service = _createService({ REQUIRED_VAR: undefined });

    expect(() => service.getConfig()).toThrow("Invalid configuration");
});

it("getConfig is callable multiple times and returns the same result", () => {
    const service = _createService();

    expect(service.getConfig()).toEqual(service.getConfig());
});
