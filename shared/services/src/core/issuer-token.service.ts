import { TokenRequest, TokenResponse } from "@url-shortner/contracts";

export type IssuerTokenService = ReturnType<typeof _factory>;

export type HttpResponse = {
    status: number;
    [key: string]: any;
};

const _factory = (opts: {
    requestToken: (_payload: TokenRequest) => Promise<TokenResponse>;
    sub: string;
    aud: string;
    now?: () => number;
    refreshSkewSeconds?: number;
}) => {
    const now = opts.now ?? (() => Math.floor(Date.now() / 1000));
    const refreshSkewSeconds = opts.refreshSkewSeconds ?? 30;

    let cachedToken: string | undefined;
    let cachedExpiresAt: number | undefined;
    let inFlightTokenRequest: Promise<string> | undefined;

    const _isValidToken = () => {
        if (!cachedToken || !cachedExpiresAt) {
            return false;
        }

        return cachedExpiresAt - now() > refreshSkewSeconds;
    };

    const getToken = async () => {
        if (_isValidToken()) {
            return cachedToken as string;
        }

        if (inFlightTokenRequest) {
            return await inFlightTokenRequest;
        }

        inFlightTokenRequest = (async () => {
            const issued = await opts.requestToken({
                sub: opts.sub,
                aud: opts.aud,
            });

            cachedToken = issued.token;
            cachedExpiresAt = issued.expiresAt;

            return issued.token;
        })();

        try {
            return await inFlightTokenRequest;
        } finally {
            inFlightTokenRequest = undefined;
        }
    };

    const clearToken = () => {
        cachedToken = undefined;
        cachedExpiresAt = undefined;
    };

    const withRetryOnUnauthorized = async <T extends HttpResponse>(
        call: (token: string) => Promise<T>
    ): Promise<T> => {
        const token = await getToken();
        const response = await call(token);

        if (response.status === 401) {
            clearToken();
            const freshToken = await getToken();
            return call(freshToken);
        }

        return response;
    };

    return {
        getToken,
        clearToken,
        withRetryOnUnauthorized,
    };
};

export default _factory;
