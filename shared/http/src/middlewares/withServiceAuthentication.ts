import { Request, Response, NextFunction } from "express";
import { Meter } from "@url-shortner/observability";
import { Logger } from "@url-shortner/observability";
import { IssuerHttpClient } from "../clients/issuer.http.service";
import { ServiceAuthContextZodObject } from "@url-shortner/contracts";
import { decodeProtectedHeader, decodeJwt, importSPKI, jwtVerify, JWTPayload } from "jose";
import { LRUCache } from "lru-cache";

type ImportedKey = Awaited<ReturnType<typeof importSPKI>>;

declare global {
    namespace Express {
        interface Request {
            serviceAuth?: {
                sub: string;
                iss: string;
                aud: string | string[];
                jti: string;
                kid: string;
            };
        }
    }
}

type Opts = {
    logger: Logger;
    meter: Meter;
    issuerHttpClient: IssuerHttpClient;
    expectedIss: string;
    expectedAud: string;
    allowedCallers?: string[];
};

const _factory = (opts: Opts) => {
    const { logger, meter, issuerHttpClient, expectedIss, expectedAud, allowedCallers } = opts;

    const authRequestsTotal = meter.createCounter("auth_requests_total", {
        description: "Total auth verification attempts",
    });

    const authFailuresTotal = meter.createCounter("auth_failures_total", {
        description: "Auth verification failures by reason",
    });

    const keyCache = new LRUCache<string, ImportedKey>({ max: 2, ttl: 5 * 60 * 1000 });

    const _fetchAndCacheKey = async () => {
        const { kid, publicKey } = await issuerHttpClient.getPublicKey();
        const key = await importSPKI(publicKey, "EdDSA");
        keyCache.set(kid, key);
        return { kid, key };
    };

    const _resolveKey = async (kid: string) => {
        const cached = keyCache.get(kid);
        if (cached) {
            return cached;
        }

        const fetched = await _fetchAndCacheKey();
        return fetched.kid === kid ? fetched.key : undefined;
    };

    const _verifyWithRefresh = async (token: string, kid: string) => {
        const key = await _resolveKey(kid);

        if (!key) {
            const error = new Error("Unknown key id");
            (error as Error & { code?: string }).code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
            throw error;
        }

        try {
            const { payload } = await jwtVerify(token, key, {
                issuer: expectedIss,
                audience: expectedAud,
                algorithms: ["EdDSA"],
            });

            return { payload, kid };
        } catch (error) {
            const err = error as Error & { code?: string };

            if (err.code !== "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
                throw err;
            }

            keyCache.delete(kid);

            const refreshed = await _fetchAndCacheKey();
            if (refreshed.kid !== kid) {
                throw err;
            }

            const { payload } = await jwtVerify(token, refreshed.key, {
                issuer: expectedIss,
                audience: expectedAud,
                algorithms: ["EdDSA"],
            });

            return { payload, kid };
        }
    };

    const _mapReason = (error: unknown) => {
        const err = error as Error & { code?: string };

        if (err.code === "ERR_JWT_EXPIRED") {
            return "expired";
        }

        if (err.code?.startsWith("ERR_JWS")) {
            return "invalid_signature";
        }

        return "bad_claims";
    };

    const _extractKid = (token: string) => {
        const { kid } = decodeProtectedHeader(token);

        if (!kid || typeof kid !== "string") {
            throw new Error("Missing kid");
        }

        return kid;
    };

    const _handleUnauthorized = (res: Response, reason: string) => {
        authFailuresTotal.add(1, { reason });
        return res.status(401).json({ error: "Unauthorized" });
    };

    const _extractServiceId = (req: Request) => {
        const raw = req.headers["x-service-id"];
        if (Array.isArray(raw)) {
            return raw[0];
        }

        return raw;
    };

    const withServiceAuthentication = async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers["authorization"];
        const traceId = req.headers["x-trace-id"];
        const requestId = req.headers["x-request-id"];

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return _handleUnauthorized(res, "bad_claims");
        }

        const token = authHeader.slice(7);

        try {
            const kid = _extractKid(token);
            const { payload } = await _verifyWithRefresh(token, kid);
            const claims = ServiceAuthContextZodObject.parse({ ...payload, kid } as JWTPayload & { kid: string });
            const requesterServiceId = _extractServiceId(req);

            if (allowedCallers && allowedCallers.length > 0 && !allowedCallers.includes(claims.sub)) {
                authFailuresTotal.add(1, { reason: "policy_denied" });
                authRequestsTotal.add(1, { status: "forbidden", outcome: "failure", target_service: expectedAud, route_group: req.route?.path ?? req.path });
                return res.status(403).json({ error: "Forbidden" });
            }

            if (requesterServiceId && requesterServiceId !== claims.sub) {
                authFailuresTotal.add(1, { reason: "policy_denied" });
                authRequestsTotal.add(1, { status: "forbidden", outcome: "failure", target_service: expectedAud, route_group: req.route?.path ?? req.path });
                return res.status(403).json({ error: "Forbidden" });
            }

            req.serviceAuth = {
                sub: claims.sub,
                iss: claims.iss,
                aud: claims.aud,
                jti: claims.jti,
                kid: claims.kid,
            };

            logger.info({
                trace_id: Array.isArray(traceId) ? traceId[0] : traceId,
                request_id: Array.isArray(requestId) ? requestId[0] : requestId,
                caller_service: claims.sub,
                target_service: expectedAud,
                route: req.path,
                kid: claims.kid,
                status_code: 200,
            }, "auth.verified");
            authRequestsTotal.add(1, { status: "ok", outcome: "success", target_service: expectedAud, route_group: req.route?.path ?? req.path });

            next();
        } catch (error) {
            const reason = _mapReason(error);
            let callerService: string | undefined;
            let kidValue: string | undefined;

            try {
                kidValue = _extractKid(token);
                const payload = decodeJwt(token);
                callerService = (payload as any)?.sub;
            } catch {
                // silently fail to extract caller_service on malformed token
            }

            logger.warn({
                trace_id: Array.isArray(traceId) ? traceId[0] : traceId,
                request_id: Array.isArray(requestId) ? requestId[0] : requestId,
                caller_service: callerService,
                target_service: expectedAud,
                route: req.path,
                kid: kidValue,
                status_code: 401,
                failure_reason: reason,
            }, "auth.failed");
            authRequestsTotal.add(1, { status: "unauthorized", outcome: "failure", target_service: expectedAud, route_group: req.route?.path ?? req.path });
            return _handleUnauthorized(res, reason);
        }
    };

    return { withServiceAuthentication };
};

export default _factory;
