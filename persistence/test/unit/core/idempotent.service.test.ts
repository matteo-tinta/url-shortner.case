import createIdempotentResultService from "../../../src/core/idempotent.service";
import { RedisService } from "../../../src/core/redis.service";

const _createMocks = () => {
    const mockRedisService: RedisService = {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        INCR: vi.fn(),
        DECR: vi.fn(),
        zAdd: vi.fn(),
        zCard: vi.fn(),
        zRemRangeByScore: vi.fn(),
        zRangeWithScores: vi.fn(),
        expire: vi.fn(),
        multi: vi.fn(),
        watch: vi.fn(),
        unwatch: vi.fn(),
    };

    return {
        key: "test_key",
        service: createIdempotentResultService(mockRedisService)({
            key: "test_key"
        }),
        mockRedisService: vi.mocked(mockRedisService),
    };
}

it("returns valid idempotency result from cache", async () => {
    //Arrange
    const expectedResult = {
        statusCode: 200,
        body: { message: "Success" }
    };

    const { service, mockRedisService } = _createMocks();

    mockRedisService.get.mockResolvedValue(JSON.stringify(expectedResult));

    //Act
    const result = await service.getIdempotencyResult();

    //Assert
    expect(result).toEqual(expectedResult);
});

it("returns nothing if data is not correct", async () => {
    //Arrange
    const expectedResult = {
        invalid: "data"
    };

    const { service, mockRedisService } = _createMocks();

    mockRedisService.get.mockResolvedValue(JSON.stringify(expectedResult));

    //Act
    const result = await service.getIdempotencyResult();

    //Assert
    expect(result).toBeNull();
});

it("stores idempotency result in cache", async () => {
    //Arrange
    const resultToStore = {
        statusCode: 201,
        body: { message: "Created" }
    };
    const aDayInSeconds = 24 * 60 * 60;

    const { service, mockRedisService, key } = _createMocks();

    //Act
    await service.storeIdempotencyResult(resultToStore);

    //Assert
    expect(mockRedisService.set).toHaveBeenCalledWith(
        `${key}:result`,
        JSON.stringify(resultToStore),
        { EX: aDayInSeconds }
    );
});