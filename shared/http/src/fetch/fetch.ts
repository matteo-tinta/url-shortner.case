const _fetchFactory = (factoryOptions: {
    fetch: typeof globalThis.fetch,
    baseUrl: string
}) => async (url: RequestInfo | URL, options?: RequestInit) => {
    const { baseUrl, fetch } = factoryOptions;

    console.debug(`[FETCH] - '${baseUrl}${url}'`);

    return await fetch(`${baseUrl}${url}`, {
        ...options,
    });
};

// const fetchFn = _fetchFactory({
//     fetch: globalThis.fetch,
//     baseUrl: appConfigs.PERSISTENCE_API_BASE_URL
// });

export default _fetchFactory;