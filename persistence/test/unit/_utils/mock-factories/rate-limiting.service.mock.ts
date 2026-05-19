import { RateLimitingService } from "../../../../src/core/rate-limiting.service";

export const _createMockedRateLimitingService = () => {

    const mockedGetLastRequestTimestamp = vi.fn().mockResolvedValue(undefined);
    const mockedCleanup = vi.fn().mockResolvedValue(undefined);
    const mockedIsRateLimited = vi.fn().mockResolvedValue(false);
    const mockedUpsert = vi.fn().mockResolvedValue(undefined);

    const service: RateLimitingService = {
        getLastRequestTimestamp: mockedGetLastRequestTimestamp,
        cleanupOldEntries: mockedCleanup,
        isRateLimited: mockedIsRateLimited,
        upsertRequestTimestamp: mockedUpsert
    }

    return {
        service: vi.mocked(service),
        factory: vi.fn(() => service)
    }
}