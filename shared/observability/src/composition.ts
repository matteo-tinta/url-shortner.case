import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import {
    MeterProvider,
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { trace } from "@opentelemetry/api"
import { metrics } from "@opentelemetry/api"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http"
import { default as createBaseLogger } from "./loggers/base.logger";
import { default as createWithSpan } from "./hof/withSpan";


const install = (options: {
    serviceName: string;
    serviceVersion: string;
    env: "development" | "production" | "staging";
    collectorUrl?: string;
}) => {
    const shouldExport = options.env === "production" && !!options.collectorUrl;
    const COLLECTOR_URL = options.collectorUrl

    // One resource shared by traces and metrics.
    // This is what tells the backend "who sent this data."
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: options.serviceName,
        [ATTR_SERVICE_VERSION]: options.serviceVersion,
    })

    // Span exporter: console locally, OTLP in production.
    // OTLP/HTTP ships spans to your Collector over HTTP.
    // The Collector then forwards to Jaeger, Tempo, Datadog, etc.
    const spanExporter = shouldExport
        ? new OTLPTraceExporter({ url: `${COLLECTOR_URL}/v1/traces` })
        : new ConsoleSpanExporter()

    // Metric exporter: same idea.
    // ConsoleMetricExporter prints every 10s locally so you can see what's being emitted.
    const metricExporter = shouldExport
        ? new OTLPMetricExporter({ url: `${COLLECTOR_URL}/v1/metrics` })
        : new ConsoleMetricExporter()

    // MeterProvider is separate from the trace SDK.
    // It owns metric collection and export independently.
    const meterProvider = new MeterProvider({
        resource,
        readers: [
            new PeriodicExportingMetricReader({
                exporter: metricExporter,
                exportIntervalMillis: 60_000, // export every 60s
            }),
        ],
    })

    //install here open telemetry, tracing, logging, etc. for both persistence and redirect modules
    const sdk = new NodeSDK({
        resource,
        traceExporter: spanExporter,
        metricReader: new PeriodicExportingMetricReader({
            exporter: metricExporter,
        }),
    });

    // Initialize traces here
    metrics.setGlobalMeterProvider(meterProvider)

    const tracer = trace.getTracer(options.serviceName, options.serviceVersion)
    const meter = metrics.getMeter(options.serviceName, options.serviceVersion)

    const withSpan = createWithSpan({ tracer });

    const startSdk = () => sdk.start();

    const destroy = async () => {
        await sdk.shutdown();
    }

    const logger = createBaseLogger({
        logLevel: shouldExport ? "info" : "debug",
        env: options.env,
        serviceName: options.serviceName,
        serviceVersion: options.serviceVersion,
    });

    return {
        install: startSdk,
        destroy,
        tracer,
        meter,
        logger,
        withSpan,
    }
}

export default install;

//other dependencies
export {
    trace,
    SpanStatusCode
} from "@opentelemetry/api";

//types
export type Tracer = ReturnType<typeof install>["tracer"];
export type Meter = ReturnType<typeof install>["meter"];