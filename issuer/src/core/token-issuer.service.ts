import { TokenRequest, TokenRequestZodObject, PublicKeyResponse, TokenResponse } from "@url-shortner/contracts";
import { Logger, Meter } from "@url-shortner/observability";
import { importPKCS8, SignJWT } from "jose";

export type IssueTokenOptions = {
    traceId?: string;
    requestId?: string;
};

export type TokenIssuerService = ReturnType<typeof _factory>;

const _factory = (opts: {
    privateKeyPem: string;
    publicKeyPem: string;
    keyId: string;
    issuer: string;
    ttlSeconds: number;
    logger: Logger;
    meter: Meter;
}) => {
    const privateKeyPromise = importPKCS8(opts.privateKeyPem.replace(/\\n/g, "\n"), "EdDSA");
    const publicKeyPem = opts.publicKeyPem.replace(/\\n/g, "\n");

    const tokenIssuedTotal = opts.meter.createCounter("token_issued_total", {
        description: "Total issued tokens",
    });

    const tokenIssueFailuresTotal = opts.meter.createCounter("token_issue_failures_total", {
        description: "Token issuance failures",
    });

    const issueToken = async (payload: TokenRequest, issueOpts?: IssueTokenOptions): Promise<TokenResponse> => {
        const request = TokenRequestZodObject.parse(payload);
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + opts.ttlSeconds;

        try {
            const privateKey = await privateKeyPromise;
            const token = await new SignJWT({})
                .setProtectedHeader({ alg: "EdDSA", kid: opts.keyId })
                .setIssuer(opts.issuer)
                .setAudience(request.aud)
                .setSubject(request.sub)
                .setIssuedAt(now)
                .setExpirationTime(expiresAt)
                .setJti(crypto.randomUUID())
                .sign(privateKey);

            tokenIssuedTotal.add(1, {
                issuer: opts.issuer,
                caller_service: request.sub,
                kid: opts.keyId,
                outcome: "success",
            });

            opts.logger.info({
                trace_id: issueOpts?.traceId,
                request_id: issueOpts?.requestId,
                caller_service: request.sub,
                target_service: request.aud,
                kid: opts.keyId,
                status_code: 200,
            }, "token.issued");

            return {
                token,
                expiresAt,
            };
        } catch (error) {
            const err = error as Error;
            tokenIssueFailuresTotal.add(1, { reason: "sign_failure" });
            opts.logger.error({
                trace_id: issueOpts?.traceId,
                request_id: issueOpts?.requestId,
                caller_service: request.sub,
                kid: opts.keyId,
                status_code: 500,
                failure_reason: err.message,
                error: err,
            }, "token.issue.failed");
            throw error;
        }
    };

    const getPublicKey = async (): Promise<PublicKeyResponse> => {
        return {
            kid: opts.keyId,
            publicKey: publicKeyPem,
        };
    };

    return {
        issueToken,
        getPublicKey,
    };
};

export default _factory;
