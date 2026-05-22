import createWithErrorHandlingMiddleware from "../../../src/middlewares/withErrorHandling";
import { _createExpressRequestResponseNext } from "../_utils/mock-factories/express.mock";

it("should return 500 if error is thrown and no custom handler is provided",
    () => {
        //Arrange
        const { req, res, next } = _createExpressRequestResponseNext();
        const error = new Error("Test error");

        const middleware = createWithErrorHandlingMiddleware();

        //Act
        middleware.withErrorHandling(error, req, res, next);

        //Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });

it("should execute custom error handler if provided", () => {
    () => {
        //Arrange
        const { req, res, next } = _createExpressRequestResponseNext();
        const error = new Error("Test error");
        const mockedError = new Error("Handler error")

        const mockedFn = vi.fn().mockThrow(mockedError);
        const middleware = createWithErrorHandlingMiddleware({
            errorHandler: mockedFn
        });

        //Act
        middleware.withErrorHandling(error, req, res, next);

        //Assert
        expect(next).toHaveBeenCalledWith(mockedError);
    }
});