import { NextFunction, Request, Response } from "express";
import { Mutex, MutexTimeoutError } from "../core/mutex.service";

const _factory = ((
    opts: { mutex: Mutex }
) => {
    const { mutex } = opts;

    const withConcurrentLimiting = () => async (req: Request, res: Response, next: NextFunction) => {
        try {
            await mutex.acquireLock()
        } catch (e) {
            if (e instanceof MutexTimeoutError)
                return res.status(429).send('Too busy')

            return next(e)
        }

        res.on('finish', () => mutex.release())
        next()
    }

    return {
        withConcurrentLimiting
    }
})

export default _factory;