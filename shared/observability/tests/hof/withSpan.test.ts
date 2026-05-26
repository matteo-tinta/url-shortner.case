import createWithSpan from "../../src/hof/withSpan";
import { SpanStatusCode } from "@opentelemetry/api";

const _createMockSpan = () => ({
    setStatus: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
    setAttribute: vi.fn(),
    updateName: vi.fn(),
});

const _createMockTracer = (span: ReturnType<typeof _createMockSpan>) => ({
    startActiveSpan: vi.fn((_name: string, _opts: any, fn: (span: any) => any) => fn(span)),
});

describe("withSpan", () => {
    it("should call fn with the span and return its result", async () => {
        //Arrange
        const span = _createMockSpan();
        const tracer = _createMockTracer(span);
        const withSpan = createWithSpan({ tracer: tracer as any });
        const expected = { data: "result" };
        const fn = vi.fn().mockResolvedValue(expected);

        //Act
        const result = await withSpan("test-span", { "attr": "value" }, fn);

        //Assert
        expect(tracer.startActiveSpan).toHaveBeenCalledWith(
            "test-span",
            { attributes: { "attr": "value" } },
            expect.any(Function)
        );
        expect(fn).toHaveBeenCalledWith(span);
        expect(result).toBe(expected);
    });

    it("should set span status OK and call span.end on success", async () => {
        //Arrange
        const span = _createMockSpan();
        const tracer = _createMockTracer(span);
        const withSpan = createWithSpan({ tracer: tracer as any });

        //Act
        await withSpan("test-span", {}, async () => "done");

        //Assert
        expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
        expect(span.end).toHaveBeenCalled();
    });

    it("should set ERROR status, record exception, rethrow and end span on failure", async () => {
        //Arrange
        const span = _createMockSpan();
        const tracer = _createMockTracer(span);
        const withSpan = createWithSpan({ tracer: tracer as any });
        const error = new Error("Original error");

        //Act & Assert
        await expect(withSpan("test-span", {}, async () => { throw error; }))
            .rejects.toBe(error);

        expect(span.setStatus).toHaveBeenCalledWith({
            code: SpanStatusCode.ERROR,
            message: error.message,
        });
        expect(span.recordException).toHaveBeenCalledWith(error);
        expect(span.end).toHaveBeenCalledTimes(1);
    });
});
