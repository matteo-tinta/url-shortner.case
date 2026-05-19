import { withScopedService, withScopedShortUrlServiceFactory } from "../../../src/middlewares/withScopedService";

describe("withScopedService", () => {
    it("should attach the service to the request object", () => {
        // Arrange
        const mockServiceFactory = vi.fn().mockReturnValue({ some: "service" });
        const middleware = withScopedService("testService", mockServiceFactory);
        const req: any = {
            container: {}
        };
        const next = vi.fn();

        //Act
        middleware(req as any, {} as any, next);

        //Assert
        expect(mockServiceFactory).toHaveBeenCalledWith(req);
        expect(req.container.testService).toEqual({ some: "service" });
        expect(next).toHaveBeenCalled();
    });

    it("should error when service key is missing", () => {
        // Arrange
        const mockServiceFactory = vi.fn().mockReturnValue({ some: "service" });

        //Act & Assert
        //We trow at creation, so it will popout at startup time
        const middleware = expect(() => withScopedService("", mockServiceFactory)).toThrow("Service name must be provided");
    });
});

describe("withScopedShortUrlServiceFactory", () => {
    it("should attach the shortUrlService to the request object", () => {
        // Arrange
        const mockDb = {};
        const mockFactory = vi.fn().mockReturnValue({ some: "service" });
        const middleware = withScopedShortUrlServiceFactory(mockFactory)(mockDb as any);
        const req: any = {
            container: {}
        };

        //Act
        middleware(req as any, {} as any, () => { });

        //Assert
        expect(mockFactory).toHaveBeenCalledWith(mockDb);
        expect(req.container.shortUrlService).toEqual({ some: "service" });
    });
});