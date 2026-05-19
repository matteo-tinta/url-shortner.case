import createConfigService, { Config, ConfigService } from "../../../src/core/config.service";

const mockEnv: NodeJS.ProcessEnv = {
    DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
    REDIS_URL: "redis://localhost:6379",
}

const _createService = (overrides: Partial<NodeJS.ProcessEnv> = {}) => {
    const mockEnvWithOverrides = {
        ...mockEnv,
        ...overrides
    };

    return createConfigService(mockEnvWithOverrides);
}

it.each([
    "DATABASE_URL",
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
    const configService: ConfigService = _createService();

    //Act
    const config = configService.getConfig();

    //Assert
    expect(config).toEqual({
        DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
        REDIS_URL: "redis://localhost:6379",
        RATE_LIMIT_WINDOW_MS: 60000,
        RATE_LIMIT_MAX_REQUESTS: 30,
        PORT: 4000
    });
});