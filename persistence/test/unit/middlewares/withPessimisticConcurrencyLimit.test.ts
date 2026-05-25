import createWithPessimisticConcurrencyLimitMiddleware from "../../../src/middlewares/withPessimisticConcurrencyLimit";
import { expressMockFactory } from "@url-shortner/tests";
import { _createMockedConcurrentService } from "../_utils/mock-factories/optimistic-concurrent.service.mock";

it("should acquire and release lock properly", async () => {
    //Arrange
    const key = "test-key";
    const { req, res, next } = expressMockFactory({
        req: {
            headers: {
                "idempotency-key": key
            }
        }
    });

    const { service: concurrentService } = _createMockedConcurrentService();
    const concurrentServiceFactory = vi.fn(() => concurrentService);

    const middleware = createWithPessimisticConcurrencyLimitMiddleware({
        concurrentServiceFactory: concurrentServiceFactory
    });

    //Act
    await middleware.withConcurrencyLimit({
        maxConcurrentRequests: 1,
        expirationTimeInMs: 5000
    })(req as any, res, next);

    //Assert
    expect(concurrentServiceFactory).toHaveBeenCalledWith({
        key: `${key}:lock`,
        maxConcurrentRequests: 1,
        expirationTimeInSeconds: 5
    });

    expect(concurrentService.waitUntilLockAquiredOrTimeout).toHaveBeenCalled();
    expect(concurrentService.releaseLock).toHaveBeenCalled();

    expect(next).toHaveBeenCalled();
    expect(res.once).toHaveBeenCalledWith("finish", expect.any(Function));
});

it("should throw error if idempotency key is missing", async () => {
    //Arrange
    const { req, res, next } = expressMockFactory({});

    const { service: concurrentService } = _createMockedConcurrentService();
    const concurrentServiceFactory = vi.fn(() => concurrentService);

    const middleware = createWithPessimisticConcurrencyLimitMiddleware({
        concurrentServiceFactory: concurrentServiceFactory
    });

    //Act
    expect(async () => await middleware.withConcurrencyLimit()(req as any, res, next))
        .rejects
        .toThrow();

    //Assert
    expect(concurrentService.waitUntilLockAquiredOrTimeout).not.toHaveBeenCalled();
    expect(concurrentService.releaseLock).not.toHaveBeenCalled();

    expect(next).not.toHaveBeenCalled();
    expect(res.once).not.toHaveBeenCalledWith("finish", expect.any(Function));
});



