
type MutexOptions = {
    timeoutMs?: number; // Time in milliseconds after which the lock will be automatically released
    maxConcurrent?: number; // Maximum number of concurrent locks allowed (not implemented in this version)
};

export type Mutex = ReturnType<typeof _factory>;

const _factory = ((opts: MutexOptions) => {
    const { timeoutMs = -1, maxConcurrent = 1 } = opts;

    const mutex = new ConcurrentMutex(timeoutMs, maxConcurrent);

    return mutex;
})

export class MutexTimeoutError extends Error {
    constructor() {
        super("Mutex lock timed out");
        this.name = "MutexTimeoutError";
    }
}

class ConcurrentMutex {
    constructor(private timeoutMs: number = -1, private maxConcurrent: number = 1) {
        console.log("Mutex initialized");
    }

    private _activeCount = 0
    private _queue: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];
    private _now: number = 0;

    private get _isLocked() {
        return this._activeCount >= this.maxConcurrent;
    }
    private get _isTimedOut() {
        return this.timeoutMs > 0 && (Date.now() - this._now) > this.timeoutMs;
    }

    acquireLock(): Promise<void> {
        if (this._isLocked) {
            return new Promise<void>((resolve, reject) => this._queue.push({ resolve, reject }));
        }

        this._activeCount++;
        console.log(`MUTEX: >> Acquired lock (${this._activeCount} active)`);
        this._now = Date.now();
        return Promise.resolve();
    }

    release(): void {
        if (this._isTimedOut) {
            this.drop();
            return
        }
        const next = this._queue.shift()
        if (next) {
            this._now = Date.now();

            next.resolve()
            this._activeCount--
        }

    }

    drop(): void {
        this._activeCount = 0;
        this._queue.forEach(({ reject }) => reject(new MutexTimeoutError()))
        this._queue = [];
    }

    executeTask = async (cb: () => Promise<void>) => {
        await this.acquireLock();
        try {
            await cb();
        } finally {
            this.release();
        }
    }
}

export default _factory;