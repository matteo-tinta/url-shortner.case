import { configure } from "@url-shortner/config";
import { configSchema } from "../../../src/config";

const mockEnv: NodeJS.ProcessEnv = {
    PERSISTENCE_API_BASE_URL: "http://localhost:3000",
    REDIS_URL: "redis://localhost:6379",
}

const _createService = (overrides: Partial<NodeJS.ProcessEnv> = {}) => {
    const mockEnvWithOverrides = {
        ...mockEnv,
        ...overrides
    };

    return configure(mockEnvWithOverrides, configSchema);
}

it.each([
    "PERSISTENCE_API_BASE_URL",
    "REDIS_URL",
])('throws error when required environment variable is missing', (missingVar) => {
    //Arrange

    const service = _createService({
        [missingVar]: undefined
    });

    //Act & Assert
    expect(() => service.getConfig()).toThrow("Invalid configuration");
});


it("creates config service with valid environment variables", () => {
    //Arrange
    const configService = _createService();

    //Act
    const config = configService.getConfig();

    //Assert
    expect(config).toEqual({
        PERSISTENCE_API_BASE_URL: "http://localhost:3000",
        REDIS_URL: "redis://localhost:6379",
        RATE_LIMIT_WINDOW_MS: 60000,
        RATE_LIMIT_MAX_REQUESTS: 30,
        PORT: 4000
    });
});