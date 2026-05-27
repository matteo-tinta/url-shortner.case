import { Logger } from "./logger.interface";

const _factory = (opts: {
    logger: Logger;
    traceId: string;
    spanId: string;
    requestId: string;
}) => {

    const child = opts.logger.child({
        traceId: opts.traceId,
        spanId: opts.spanId,
        requestId: opts.requestId,
    });

    return {
        logger: child,
    }
}

export default _factory;