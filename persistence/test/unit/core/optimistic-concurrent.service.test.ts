import createOptimisticConcurrentService, { OptimisticConcurrentLockServiceFactory } from "../../../src/core/optimistic-concurrent.service";
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

    const serviceConfiguration: Parameters<OptimisticConcurrentLockServiceFactory>[0] = {
        key: "test_key",
        maxConcurrentRequests: 2,
        expirationTimeInSeconds: 1,
    }

    return {
        key: "test_key",
        factory: createOptimisticConcurrentService,
        service: createOptimisticConcurrentService(mockRedisService)(serviceConfiguration),
        serviceConfiguration,
        mockRedisService: vi.mocked(mockRedisService),
    };
}

it("getConcurrencyKey should get concurrency key", async () => {
    //Arrange
    const {
        service,
        mockRedisService,
    } = _createMocks();

    mockRedisService.get.mockResolvedValue("1");

    //Act
    const result = await service.getConcurrencyKey();

    //Assert
    expect(mockRedisService.get).toHaveBeenCalledWith("test_key:lock");
    expect(result).toBe(1);
})

it("releaseLock should release the lock", async () => {
    //Arrange
    const {
        service,
        mockRedisService,
    } = _createMocks();

    //Act
    await service.releaseLock();

    //Assert
    expect(mockRedisService.DECR).toHaveBeenCalledWith("test_key:lock");
})

it.skip("waitUntilLockAquiredOrTimeout should acquire lock successfully: will be tested in integration tests")