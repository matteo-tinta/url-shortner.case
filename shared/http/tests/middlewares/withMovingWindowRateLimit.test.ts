import { expressMockFactory } from "@url-shortner/tests";
import createWithMovingWindowRateLimitMiddleware from "../../src/middlewares/withMovingWindowRateLimiting";
import { createMockedRateLimitingService } from "@url-shortner/tests";

it("should allow request when under rate limit", async () => {
    //Arrange
    const { req, res, next } = expressMockFactory();

    const { service, factory: mockedRateLimitingServiceFactory } = createMockedRateLimitingService();
    const middleware = createWithMovingWindowRateLimitMiddleware({
        rateLimitingServiceFactory: mockedRateLimitingServiceFactory
    });

    //Act
    await middleware.withMovingWindowRateLimiting({
        limit: 5,
        windowMs: 60000
    })(req, res, next);

    //Assert
    expect(mockedRateLimitingServiceFactory).toHaveBeenCalledWith({
        key: req.ip,
        limit: 5,
        windowMs: 60000
    });
    expect(service.cleanupOldEntries).toHaveBeenCalled();
    expect(service.isRateLimited).toHaveBeenCalled();
    expect(service.upsertRequestTimestamp).toHaveBeenCalled();

    expect(next).toHaveBeenCalled();
});

it("should block request when over rate limit (429)", async () => {
    //Arrange
    const { req, res, next } = expressMockFactory();
    const retryAfterDate = new Date(Date.now() + 60000).getTime();
    const lastRequestTimestamp = { timestamp: retryAfterDate, httpDate: new Date(retryAfterDate).toUTCString() };

    const { service, factory: mockedRateLimitingServiceFactory } = createMockedRateLimitingService();
    service.isRateLimited.mockResolvedValue(true);
    service.getLastRequestTimestamp.mockResolvedValue(lastRequestTimestamp);

    const middleware = createWithMovingWindowRateLimitMiddleware({
        rateLimitingServiceFactory: mockedRateLimitingServiceFactory
    });

    //Act
    await middleware.withMovingWindowRateLimiting({
        limit: 5,
        windowMs: 60000
    })(req, res, next);

    //Assert
    expect(service.cleanupOldEntries).toHaveBeenCalled();
    expect(service.isRateLimited).toHaveBeenCalled();
    expect(service.upsertRequestTimestamp).not.toHaveBeenCalled();

    // Assert that response is 429 with correct headers and body
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining("Too many requests") });
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', lastRequestTimestamp.httpDate);
});

it("should handle errors from rate limiting service", async () => {
    //Arrange
    const { req, res, next } = expressMockFactory();
    const error = new Error("Test error");

    const { service, factory: mockedRateLimitingServiceFactory } = createMockedRateLimitingService();
    service.isRateLimited.mockThrow(error);
    service.cleanupOldEntries.mockThrow(error);
    service.upsertRequestTimestamp.mockThrow(error);
    service.getLastRequestTimestamp.mockThrow(error);

    const middleware = createWithMovingWindowRateLimitMiddleware({
        rateLimitingServiceFactory: mockedRateLimitingServiceFactory
    });

    //Act & Assert
    expect(async () => await middleware.withMovingWindowRateLimiting({
        limit: 5,
        windowMs: 60000
    })(req, res, next)).rejects.toThrow(error);
});


