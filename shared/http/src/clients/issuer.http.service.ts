import { PublicKeyResponseZodObject, TokenRequest, TokenRequestZodObject, TokenResponseZodObject } from "@url-shortner/contracts";
import { default as createHttpClient } from "./http-client.service";

export type IssuerHttpClient = ReturnType<typeof _factory>;

const _factory = (options: { fetch: typeof fetch }) => {
    const client = createHttpClient(options);

    const getPublicKey = async () => {
        const response = await client.get("/auth/public-key");
        return await client.validateResponseAsJsonAndReturn(response, PublicKeyResponseZodObject);
    };

    const requestToken = async (payload: TokenRequest) => {
        const body = TokenRequestZodObject.parse(payload);
        const response = await client.post("/auth/token", body);
        return await client.validateResponseAsJsonAndReturn(response, TokenResponseZodObject);
    };

    return {
        getPublicKey,
        requestToken,
    };
};

export default _factory;
