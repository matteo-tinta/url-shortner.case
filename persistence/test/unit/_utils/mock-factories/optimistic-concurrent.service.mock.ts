import { OptimisticConcurrentLockService } from "../../../../src/core/optimistic-concurrent.service";

export const _createMockedConcurrentService = () => {
    const mockedGetConcurrencyKey = vi.fn();
    const mockedWait = vi.fn().mockResolvedValue(undefined);
    const mockedRelease = vi.fn().mockResolvedValue(undefined);

    const service: OptimisticConcurrentLockService = {
        getConcurrencyKey: mockedGetConcurrencyKey,
        waitUntilLockAquiredOrTimeout: mockedWait,
        releaseLock: mockedRelease
    }

    return {
        service: vi.mocked(service),
        factory: vi.fn(() => service)
    }
}