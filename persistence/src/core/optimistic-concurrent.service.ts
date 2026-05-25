import { RedisService } from "@url-shortner/services";

export type OptimisticConcurrentLockServiceFactory = ReturnType<typeof _factory>;
export type OptimisticConcurrentLockService = ReturnType<ReturnType<typeof _factory>>;

const _factory = (client: RedisService) => function manage(opt: {
    key: string;
    maxConcurrentRequests?: number;
    expirationTimeInSeconds?: number;
}) {
    const { key, maxConcurrentRequests = 1, expirationTimeInSeconds = 2 } = opt;

    const lockKey = `${key}:lock`;

    const getConcurrencyKey = async () => {
        const result = await client.get(lockKey);
        const numResult = result && !isNaN(parseInt(result)) ? parseInt(result) : 0; //optimistic concurrency control, if value is not a number, treat it as 0

        return numResult;
    };

    const _aquireLock = async () => {
        await client.watch(lockKey);
        const count = await getConcurrencyKey();

        if (count >= maxConcurrentRequests) {
            await client.unwatch();
            return false;
        }

        // EXEC returns null if another client modified lockKey after WATCH
        const result = await client
            .multi()
            .incr(lockKey)
            .expire(lockKey, expirationTimeInSeconds + 5) // set expiration slightly longer than the time we are willing to wait
            .get(lockKey)
            .exec();

        return !!result;
    };

    const releaseLock = async () => {
        await client.DECR(lockKey);
    };

    const waitUntilLockAquiredOrTimeout = async () => {
        const startTime = new Date();

        let result = await _aquireLock();
        let times = 1;
        while (!result) {
            const now = new Date().getTime();
            if (now - startTime.getTime() > expirationTimeInSeconds * 1000) {
                throw new Error("Service Unavailable. Please try again later.");
            }

            await new Promise((r) => {
                const randomWait = Math.floor(Math.random() * 100) + 50; // Random wait between 50ms and 150ms
                setTimeout(r, 250 + randomWait * times); // Exponential backoff with jitter
            });

            result = await _aquireLock();
        }
    };

    return {
        getConcurrencyKey,
        waitUntilLockAquiredOrTimeout,
        releaseLock,
    };

};

export default _factory;