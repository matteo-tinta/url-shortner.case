import { IdempotentResultService } from "../../../../src/core/idempotent.service";

export const _createMockedIdempotentService = () => {

    const mockedGet = vi.fn().mockResolvedValue(undefined);
    const mockedStore = vi.fn().mockResolvedValue(undefined);

    const service: IdempotentResultService = {
        getIdempotencyResult: mockedGet,
        storeIdempotencyResult: mockedStore
    }

    return {
        service: vi.mocked(service),
        factory: vi.fn(() => service)
    }
}
