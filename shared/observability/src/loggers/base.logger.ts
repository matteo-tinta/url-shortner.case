import { pino } from 'pino';

const _factory = (opts: {
    logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
    env: "development" | "production" | "staging";
    serviceName: string,
    serviceVersion: string,
}) => {
    const logger = pino({
        level: opts.logLevel || "info",
        formatters: {
            level: (label) => ({ level: label }),
        },
        base: {
            service: opts.serviceName,
            version: opts.serviceVersion,
            env: opts.env,
        },
    });

    return {
        logger
    }
}

export default _factory;