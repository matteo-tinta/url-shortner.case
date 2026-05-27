import createWithConcurrentLimitingMiddleware from "../../../src/middlewares/withConcurrentLimiting";
import { expressMockFactory } from "@url-shortner/tests";
import { MutexTimeoutError } from "../../../src/core/mutex.service";

const _createMockMutex = () => ({
    acquireLock: vi.fn(),
    release: vi.fn(),
});

describe("withConcurrentLimiting", () => {
    it("should acquire lock, release on finish and call next", async () => {
        //Arrange
        const mutex = _createMockMutex();
        mutex.acquireLock.mockResolvedValue(undefined);
        const { req, res, next } = expressMockFactory();

        const middleware = createWithConcurrentLimitingMiddleware({
            mutex: mutex as any,
        });

        //Act
        await middleware.withConcurrentLimiting()(req as any, res as any, next as any);

        //Assert
        expect(mutex.acquireLock).toHaveBeenCalled();
        expect(mutex.release).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it("should return 429 when mutex acquisition times out", async () => {
        //Arrange
        const mutex = _createMockMutex();
        mutex.acquireLock.mockRejectedValue(new MutexTimeoutError());

        const send = vi.fn();
        const status = vi.fn().mockReturnValue({ send });
        const { req, res, next } = expressMockFactory({
            res: { status },
        });

        const middleware = createWithConcurrentLimitingMiddleware({
            mutex: mutex as any,
        });

        //Act
        await middleware.withConcurrentLimiting()(req as any, res as any, next as any);

        //Assert
        expect(status).toHaveBeenCalledWith(429);
        expect(send).toHaveBeenCalledWith("Too busy");
        expect(next).not.toHaveBeenCalled();
    });

    it("should delegate non-timeout mutex errors to next", async () => {
        //Arrange
        const mutex = _createMockMutex();
        const error = new Error("mutex failure");
        mutex.acquireLock.mockRejectedValue(error);
        const { req, res, next } = expressMockFactory();

        const middleware = createWithConcurrentLimitingMiddleware({
            mutex: mutex as any,
        });

        //Act
        await middleware.withConcurrentLimiting()(req as any, res as any, next as any);

        //Assert
        expect(next).toHaveBeenCalledWith(error);
    });
});
