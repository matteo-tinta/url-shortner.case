import { WithSpan } from "@url-shortner/observability";

const _fetchFactory = (options: {
    fetch: typeof globalThis.fetch,
    baseUrl: string,
    withSpan: WithSpan
}) => {
    const { withSpan, ...fetchOptions } = options;

    const handleFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
        const { baseUrl, fetch } = fetchOptions;
        const completeUrl = `${baseUrl}${url}`;

        return await withSpan("fetch", {
            "http.url": completeUrl,
            "http.method": options?.method,
        }, async () => {

            return await fetch(completeUrl, {
                ...options,
            });
        });

    }

    return handleFetch;
}

export default _fetchFactory;