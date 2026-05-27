import { expressMockFactory } from "@url-shortner/tests";
import createWithIdempotentResultMiddleware from "../../../src/middlewares/withIdempotentResult";
import { _createMockedIdempotentService } from "../_utils/mock-factories/idempotent.service.mock";
import { _createMockedConcurrentService } from "../_utils/mock-factories/optimistic-concurrent.service.mock";

it("should return cached response for repeated requests with same idempotency key", async () => {
    //Arrange
    const key = "test-key";
    const { req, res, next } = expressMockFactory({
        req: {
            headers: {
                "idempotency-key": key
            }
        }
    });

    const cachedResult = {
        statusCode: 200,
        body: { message: "cached response" }
    };

    const { service: idempotentService, factory: idempotentServiceFactory } = _createMockedIdempotentService();
    idempotentService.getIdempotencyResult.mockResolvedValue(cachedResult);

    const { service: concurrentService, factory: concurrentServiceFactory } = _createMockedConcurrentService();

    const middleware = createWithIdempotentResultMiddleware({
        idempotentServiceFactory: idempotentServiceFactory,
        concurrentServiceFactory: concurrentServiceFactory
    });

    //Act
    await middleware.withIdempotentResults(_ => key)(
        req as any,
        res as any,
        next as any);

    //Assert
    expect(idempotentServiceFactory).toHaveBeenCalledWith({
        key: Buffer.from(key).toString('base64')
    });
    expect(concurrentServiceFactory).toHaveBeenCalledWith({
        key: Buffer.from(key).toString('base64'),
        maxConcurrentRequests: 1,
        expirationTimeInSeconds: 5
    });

    expect(concurrentService.getConcurrencyKey).not.toHaveBeenCalled();
    expect(concurrentService.waitUntilLockAquiredOrTimeout).toHaveBeenCalled();
    expect(idempotentService.getIdempotencyResult).toHaveBeenCalledWith();
    expect(concurrentService.releaseLock).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(cachedResult.statusCode);
    expect(res.json).toHaveBeenCalledWith(cachedResult.body);
    expect(next).not.toHaveBeenCalled();
});

it("should call next and store response for uncached successful request", async () => {
    //Arrange
    const key = "test-key";
    let finishHandler: (() => Promise<void> | void) | null = null;

    const { req, res, next } = expressMockFactory({
        req: {
            headers: {
                "idempotency-key": key
            }
        },
        res: {
            statusCode: 200,
            send: vi.fn(),
            once: vi.fn((event: string, cb: () => Promise<void> | void) => {
                if (event === "finish") {
                    finishHandler = cb;
                }
            }),
        }
    });

    const { service: idempotentService, factory: idempotentServiceFactory } = _createMockedIdempotentService();
    idempotentService.getIdempotencyResult.mockResolvedValue(null);

    const { service: concurrentService, factory: concurrentServiceFactory } = _createMockedConcurrentService();

    const middleware = createWithIdempotentResultMiddleware({
        idempotentServiceFactory,
        concurrentServiceFactory
    });

    const payload = { key: "short-code" };

    //Act
    await middleware.withIdempotentResults(_ => key)(
        req as any,
        res as any,
        next as any);

    (res as any).statusCode = 201;
    (res as any).json(payload);
    await finishHandler?.();

    //Assert
    expect(next).toHaveBeenCalled();
    expect(idempotentService.storeIdempotencyResult).toHaveBeenCalledWith({
        statusCode: 201,
        body: payload
    });
    expect(concurrentService.releaseLock).toHaveBeenCalled();
});

it("should not store response for uncached non-successful request", async () => {
    //Arrange
    const key = "test-key";
    let finishHandler: (() => Promise<void> | void) | null = null;

    const { req, res, next } = expressMockFactory({
        req: {
            headers: {
                "idempotency-key": key
            }
        },
        res: {
            statusCode: 200,
            send: vi.fn(),
            once: vi.fn((event: string, cb: () => Promise<void> | void) => {
                if (event === "finish") {
                    finishHandler = cb;
                }
            }),
        }
    });

    const { service: idempotentService, factory: idempotentServiceFactory } = _createMockedIdempotentService();
    idempotentService.getIdempotencyResult.mockResolvedValue(null);

    const { service: concurrentService, factory: concurrentServiceFactory } = _createMockedConcurrentService();

    const middleware = createWithIdempotentResultMiddleware({
        idempotentServiceFactory,
        concurrentServiceFactory
    });

    //Act
    await middleware.withIdempotentResults(_ => key)(
        req as any,
        res as any,
        next as any);

    (res as any).statusCode = 400;
    (res as any).json({ error: "bad request" });
    await finishHandler?.();

    //Assert
    expect(next).toHaveBeenCalled();
    expect(idempotentService.storeIdempotencyResult).not.toHaveBeenCalled();
    expect(concurrentService.releaseLock).toHaveBeenCalled();
});