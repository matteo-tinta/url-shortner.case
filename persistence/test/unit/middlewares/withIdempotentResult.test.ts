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