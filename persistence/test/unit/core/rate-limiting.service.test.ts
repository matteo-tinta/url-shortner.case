import createRateLimitingServiceFactory from "../../../src/core/rate-limiting.service";
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
        factory: createRateLimitingServiceFactory,
        serviceFactory: createRateLimitingServiceFactory(mockRedisService),
        mockRedisService: vi.mocked(mockRedisService),
    };
}

describe('Rate Limiting Service', () => {
    const window = 60000;

    const createTestDate = () => {
        const date = new Date(2000, 1, 1, 13)
        vi.setSystemTime(date)

        return {
            date,
            now: date.getTime(),
        }
    }

    beforeEach(() => {
        // tell vitest we use mocked time
        vi.useFakeTimers()
    })

    afterEach(() => {
        // restoring date after each test run
        vi.useRealTimers()
    })

    it("upsertRequestTimestamp should add request timestamp to sorted set", async () => {
        //Arrange
        const { now } = createTestDate();

        const windowExpiration = window * 3 / 1000;

        const { serviceFactory: service, mockRedisService } = _createMocks();
        const key = "rate_limit:test_key";

        //Act
        await service({
            key: "test_key",
            limit: 5,
            windowMs: window
        }).upsertRequestTimestamp();

        //Assert
        expect(mockRedisService.zAdd).toHaveBeenCalledWith(key, expect.objectContaining({
            score: now,
            value: expect.stringContaining(`${key}:${now}`)
        }));

        expect(mockRedisService.expire).toHaveBeenCalledWith(key, windowExpiration);
    });

    it.each([
        { count: 4, expected: false },
        { count: 5, expected: true },
        { count: 6, expected: true },
    ])("isRateLimited should return true if request count exceeds limit", async ({ count, expected }) => {
        //Arrange
        const { serviceFactory, mockRedisService } = _createMocks();
        mockRedisService.zCard.mockResolvedValue(count);

        const service = serviceFactory({
            key: "test_key",
            limit: 5,
            windowMs: window
        });

        //Act
        const result = await service.isRateLimited();

        //Assert
        expect(result).toBe(expected);
    });

    it.each([
        {
            seedData: (now: number) => ([
                { score: now - window / 5, value: "rate_limit:test_key:1" },
                { score: now + window / 5, value: "rate_limit:test_key:1" }
            ]),
            expectedRetryAfter: (now: number) => (now - window / 5) + window,
            description: "should return the timestamp of the last request"
        },
        {
            seedData: () => [],
            expectedRetryAfter: (now: number) => now + window,
            description: "should return now when no requests have been made"
        },
    ])("getLastRequestRetryAfter $description", async ({ seedData, expectedRetryAfter }) => {
        //Arrange
        const { now } = createTestDate();

        const retryAfter = expectedRetryAfter(now);

        const { serviceFactory, mockRedisService } = _createMocks();
        const service = serviceFactory({
            key: "test_key",
            limit: 5,
            windowMs: window
        });

        mockRedisService.zRangeWithScores.mockResolvedValue(seedData(now));

        //Act
        const result = await service.getLastRequestTimestamp();

        //Assert
        expect(result).toEqual({
            timestamp: retryAfter,
            httpDate: new Date(retryAfter).toUTCString()
        });
    })

    it("cleanupOldEntries should remove entries older than window", async () => {
        //Arrange
        const { now } = createTestDate();
        const windowStart = now - window;

        const { serviceFactory, mockRedisService } = _createMocks();
        const service = serviceFactory({
            key: "test_key",
            limit: 5,
            windowMs: window
        });

        //Act
        await service.cleanupOldEntries();

        //Assert
        expect(mockRedisService.zRemRangeByScore)
            .toHaveBeenCalledWith("rate_limit:test_key", '-inf', windowStart);
    })


});

