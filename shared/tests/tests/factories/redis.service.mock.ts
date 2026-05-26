import { RedisService } from "@url-shortner/redis";

export const _createMockedRedisService = () => {
    const service: RedisService = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(null),
        del: vi.fn().mockResolvedValue(0),
        INCR: vi.fn().mockResolvedValue(1),
        DECR: vi.fn().mockResolvedValue(0),
        expire: vi.fn().mockResolvedValue(1),
        zAdd: vi.fn().mockResolvedValue(1),
        zCard: vi.fn().mockResolvedValue(0),
        zRemRangeByScore: vi.fn().mockResolvedValue(0),
        zRangeWithScores: vi.fn().mockResolvedValue([]),
        watch: vi.fn().mockResolvedValue("OK"),
        unwatch: vi.fn().mockResolvedValue("OK"),
        multi: vi.fn(),
    };

    return {
        service: vi.mocked(service),
        factory: vi.fn(() => service),
    };
};
