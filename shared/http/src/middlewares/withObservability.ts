import { Request, Response, NextFunction } from "express"
import { createRequestLogger, trace, Meter, SpanStatusCode } from "@url-shortner/observability";
import { Logger } from "@url-shortner/observability/dist/loggers/logger.interface";

declare global {
    namespace Express {
        interface Request {
            log: ReturnType<typeof createRequestLogger>["logger"];
            requestId: string;
        }
    }
}

const _factory = (opts: {
    logger: Logger;
    meter: Meter,
}) => {

    const { meter } = opts;

    // Counter: total requests handled, sliced by route and status
    const requestCounter = meter.createCounter("http.server.requests", {
        description: "Total HTTP requests handled",
    })

    // Histogram: request duration distribution — gives you p50/p95/p99
    const requestDuration = meter.createHistogram("http.server.duration", {
        description: "HTTP request duration in milliseconds",
        unit: "ms",
    })

    const withObservability = async (req: Request, res: Response, next: NextFunction) => {
        const span = trace.getActiveSpan()
        const spanCtx = span?.spanContext()
        const actualRequestId = req.headers["x-request-id"] as string || crypto.randomUUID()

        // Create a request-scoped logger — every log from this request
        // automatically carries traceId and spanId
        const { logger } = createRequestLogger({
            logger: opts.logger,
            traceId: spanCtx?.traceId ?? "no-trace",
            spanId: spanCtx?.spanId ?? "no-span",
            requestId: actualRequestId,
        })

        req.log = logger
        req.requestId = actualRequestId

        // Rename the root span from the raw path to a route pattern.
        // Without this, every /orders/123, /orders/456 etc. creates a
        // separate span name and your trace backend can't aggregate them.
        // We update it again after routing when req.route is populated.
        if (span) {
            span.setAttribute("http.method", req.method)
            span.setAttribute("http.url", req.path)
        }

        logger.info({ method: req.method, path: req.path }, "request.received")

        const startTime = Date.now()

        res.on("finish", () => {
            const duration = Date.now() - startTime

            // Update span name to route pattern now that Express has matched it
            if (span) {
                const routePath = req.route?.path ?? req.path

                span.updateName(`${req.method} ${routePath}`)
                span.setAttribute("http.status_code", res.statusCode)

                if (res.statusCode >= 500) {
                    span.setStatus({ code: SpanStatusCode.ERROR })
                }
            }

            logger.info(
                { statusCode: res.statusCode, durationMs: duration },
                "request.completed"
            )

            // Record request metrics — same low-cardinality rule applies
            const metricAttributes = {
                "http.method": req.method,
                "http.route": req.route?.path ?? "unknown",
                "http.status_code": String(res.statusCode),
            }

            requestCounter.add(1, metricAttributes)
            requestDuration.record(duration, metricAttributes)
        })

        next()
    }

    return () => withObservability;
}

export default _factory;