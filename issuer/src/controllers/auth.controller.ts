import { Request, Response } from "express";
import { TokenRequest } from "@url-shortner/contracts";
import { TokenIssuerService } from "../core/token-issuer.service";

const _factory = (opts: { tokenIssuerService: TokenIssuerService }) => {
    const { tokenIssuerService } = opts;

    const issueToken = async (req: Request<unknown, unknown, TokenRequest>, res: Response) => {
        const traceId = req.headers["x-trace-id"];
        const requestId = req.headers["x-request-id"];
        const tokenResponse = await tokenIssuerService.issueToken(req.body, {
            traceId: Array.isArray(traceId) ? traceId[0] : traceId,
            requestId: Array.isArray(requestId) ? requestId[0] : requestId,
        });
        return res.status(200).json(tokenResponse);
    };

    const getPublicKey = async (_req: Request, res: Response) => {
        const key = await tokenIssuerService.getPublicKey();
        return res.status(200).json(key);
    };

    return {
        issueToken,
        getPublicKey,
    };
};

export default _factory;
