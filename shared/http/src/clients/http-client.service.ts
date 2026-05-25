
import z from "zod";
import { HttpError } from "../errors/http.errors";

export type HttpClient = ReturnType<typeof _factory>;


const _factory = (options: {
    fetch: typeof fetch
}) => {

    const _handleResponse = async (url: RequestInfo | URL, response: Response) => {
        if (!response.ok) {
            throw new HttpError(url, response);
        }

        return response;
    }

    const _validateJsonResponse = async <T>(response: Response, zodSchema: z.ZodSchema<T>) => {
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("application/json")) {
            throw new Error(`Expected JSON response but got '${contentType}'`);
        }

        const jsonData = await response.json();

        return zodSchema.parse(jsonData);
    }

    const get = async (
        url: string,
        params?: Omit<RequestInit, "method">,
    ) => {
        const response = await options.fetch(url, {
            method: "GET",
            ...params
        });

        return await _handleResponse(url, response);
    }

    return {
        get,
        validateResponseAsJsonAndReturn: _validateJsonResponse
    }
}

export default _factory;