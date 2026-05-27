import createWithObservabilityMiddleware from "../../src/middlewares/withObservability";
import { expressMockFactory } from "@url-shortner/tests";

const mocks = vi.hoisted(() => {
    const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        child: vi.fn(),
    };
    mockLogger.child.mockReturnValue(mockLogger);

    return { mockLogger };
});

vi.mock("@url-shortner/observability", () => ({
    createRequestLogger: vi.fn(() => ({ logger: mocks.mockLogger })),
    trace: { getActiveSpan: vi.fn().mockReturnValue(undefined) },
    SpanStatusCode: { ERROR: "ERROR", OK: "OK" },
}));

const _createMockMeter = () => {
    const counter = { add: vi.fn() };
    const histogram = { record: vi.fn() };
    const meter = {
        createCounter: vi.fn().mockReturnValue(counter),
        createHistogram: vi.fn().mockReturnValue(histogram),
    };
    return { meter, counter, histogram };
};

describe("withObservability", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should set req.log and req.requestId on the request", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory({
            req: { headers: { "x-request-id": "existing-id" } }
        });
        const { meter } = _createMockMeter();
        const middleware = createWithObservabilityMiddleware({
            logger: mocks.mockLogger as any,
            meter: meter as any,
        })();

        //Act
        await middleware(req as any, res as any, next);

        //Assert
        expect(req.requestId).toBe("existing-id");
        expect(req.log).toBeDefined();
        expect(next).toHaveBeenCalled();
    });

    it("should generate a requestId when x-request-id header is absent", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory();
        const { meter } = _createMockMeter();
        const middleware = createWithObservabilityMiddleware({
            logger: mocks.mockLogger as any,
            meter: meter as any,
        })();

        //Act
        await middleware(req as any, res as any, next);

        //Assert
        expect(req.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });

    it("should record request counter and duration histogram on response finish", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory();
        const { meter, counter, histogram } = _createMockMeter();
        const middleware = createWithObservabilityMiddleware({
            logger: mocks.mockLogger as any,
            meter: meter as any,
        })();

        //Act
        await middleware(req as any, res as any, next);

        //Assert
        expect(counter.add).toHaveBeenCalledWith(1, expect.any(Object));
        expect(histogram.record).toHaveBeenCalledWith(expect.any(Number), expect.any(Object));
    });

    it("should log request.received when handling the request", async () => {
        //Arrange
        const { req, res, next } = expressMockFactory();
        const { meter } = _createMockMeter();
        const middleware = createWithObservabilityMiddleware({
            logger: mocks.mockLogger as any,
            meter: meter as any,
        })();

        //Act
        await middleware(req as any, res as any, next);

        //Assert
        expect(mocks.mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({ method: expect.any(String), path: expect.any(String) }),
            "request.received"
        );
    });
});
