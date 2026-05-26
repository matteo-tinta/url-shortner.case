import createMutex, { MutexTimeoutError } from "../../../src/core/mutex.service";

describe("Mutex Service", () => {
    it("should queue second lock until first one is released", async () => {
        //Arrange
        const mutex = createMutex({ maxConcurrent: 1, timeoutMs: -1 });
        await mutex.acquireLock();

        let acquiredSecond = false;
        const secondLock = mutex.acquireLock().then(() => {
            acquiredSecond = true;
        });

        //Act
        await Promise.resolve();

        //Assert
        expect(acquiredSecond).toBe(false);

        //Act
        mutex.release();
        await secondLock;

        //Assert
        expect(acquiredSecond).toBe(true);
    });

    it("should reject queued locks when dropped", async () => {
        //Arrange
        const mutex = createMutex({ maxConcurrent: 1, timeoutMs: -1 });
        await mutex.acquireLock();

        const pendingLock = mutex.acquireLock();

        //Act
        mutex.drop();

        //Assert
        await expect(pendingLock).rejects.toBeInstanceOf(MutexTimeoutError);
    });

    it("should drop queued locks when release is called after timeout", async () => {
        //Arrange
        vi.useFakeTimers();
        const now = new Date(2024, 1, 1, 12, 0, 0);
        vi.setSystemTime(now);

        const mutex = createMutex({ maxConcurrent: 1, timeoutMs: 5 });
        await mutex.acquireLock();
        const pendingLock = mutex.acquireLock();

        //Act
        vi.advanceTimersByTime(10);
        mutex.release();

        //Assert
        await expect(pendingLock).rejects.toBeInstanceOf(MutexTimeoutError);

        vi.useRealTimers();
    });
});
