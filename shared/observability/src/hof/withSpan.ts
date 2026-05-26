import { trace, SpanStatusCode, Span, Attributes, context, propagation } from "@opentelemetry/api"

const _factory = (opts: {
    tracer: ReturnType<typeof trace.getTracer>;
}) => {
    const { tracer } = opts;

    const withSpan = async function <T>(
        name: string,
        attributes: Attributes,
        fn: (span: Span) => Promise<T>
    ): Promise<T> {
        return tracer.startActiveSpan(name, { attributes }, async (span) => {
            try {
                const result = await fn(span)
                span.setStatus({ code: SpanStatusCode.OK })
                return result
            } catch (err: any) {
                span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
                // recordException creates a span *event* with the stack trace,
                // timestamp, and exception type. Not an attribute — an event.
                // This is how your trace backend links spans to stack traces.
                span.recordException(err)
                throw err
            } finally {
                // If you forget span.end(), the span lives in memory forever
                // and never gets exported. Silent data loss. Always in finally.
                span.end()
            }
        })
    }

    return withSpan;
}

export default _factory;

export type WithSpan = ReturnType<typeof _factory>;