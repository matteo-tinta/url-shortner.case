
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
        params?: Omit<RequestInit, "method"> & {
            requestId?: string,
        },
    ) => {
        const { requestId, ...httpParams } = params || {};

        const response = await options.fetch(url, {
            method: "GET",
            ...httpParams,
            headers: {
                ...httpParams.headers,
                "X-Request-Id": requestId || "",
            },
        });

        return await _handleResponse(url, response);
    }

    const post = async (
        url: string,
        body: unknown,
        params?: Omit<RequestInit, "method" | "body"> & {
            requestId?: string,
        },
    ) => {
        const { requestId, ...httpParams } = params || {};

        const response = await options.fetch(url, {
            method: "POST",
            ...httpParams,
            headers: {
                "Content-Type": "application/json",
                ...httpParams.headers,
                "X-Request-Id": requestId || "",
            },
            body: JSON.stringify(body),
        });

        return await _handleResponse(url, response);
    }

    return {
        get,
        post,
        validateResponseAsJsonAndReturn: _validateJsonResponse
    }
}

export default _factory;