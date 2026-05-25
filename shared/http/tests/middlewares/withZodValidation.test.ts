import createWithZodValidationMiddleware from "../../src/middlewares/withZodValidation";
import { z } from "zod";
import { expressMockFactory } from "@url-shortner/tests";

it("should return 400 if validation fails", () => {
    //Arrange
    const schema = z.object({
        name: z.string(),
    });

    const { req, res, next } = expressMockFactory();

    req.body = {
        name: 123, // Invalid type
    };

    const middleware = createWithZodValidationMiddleware(
        schema,
        req => req.body);

    //Act
    middleware(req, res, next);

    //Assert
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith([{
        code: "invalid_type",
        expected: "string",
        message: expect.stringContaining("expected string, received number"),
        path: ["name"],
    }]);
});

it("should call next if validation passes", () => {
    //Arrange
    const schema = z.object({
        name: z.string(),
    });

    const { req, res, next } = expressMockFactory();

    req.body = {
        name: "John",
    };

    const middleware = createWithZodValidationMiddleware(
        schema,
        req => req.body);

    //Act
    middleware(req, res, next);

    //Assert
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
});