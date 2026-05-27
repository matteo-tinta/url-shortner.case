---
status: Approved
date: 2026-05-27
---

# AD: Authentication Between Services

## Context and Problem Statement

There is currently no reliable service-to-service authentication.
If routing or gateway configuration is wrong, internal operational endpoints can be reached by unauthorized callers.
We need a mechanism that is simple to implement now, supports short credential lifetime, and does not require runtime token lookup on every request.

## Summary

Use short-lived signed JWT service tokens (3 minutes TTL) issued by one internal issuer service.
Keep the private key only in the issuer.
Expose a read-only public key endpoint for verifiers.
Do not use IAM services for this phase.

## Decision Drivers

- Protect operational endpoints.
- Keep implementation effort low.
- Avoid per-request auth calls to a central authority.
- Keep a clean migration path to JWKS later.

## Considered Options

1. Do not authenticate.
2. Static opaque API token (Bearer).
3. Signed JWT + simple public key endpoint.
4. Full JWKS key distribution.
5. mTLS-first service identity.

## Option Assessment

1. Do not authenticate: rejected.
Reason: operational endpoints remain exposed on infra misconfiguration.

2. Static opaque token: rejected for current direction.
Reason: simple to start, but rotation/revocation creates central state and frequent operational calls or cache complexity.

3. Signed JWT + simple public key endpoint: selected.
Reason: minimal runtime coupling, short TTL, simple enough to build now in Node.

4. Full JWKS: deferred.
Reason: best for multi-key and seamless rotation, but unnecessary complexity for current scope.

5. mTLS-first: deferred.
Reason: strongest infra identity model, but implementation cost and operational overhead are too high for current ROI.

## Decision Outcome
Use one internal issuer service that signs JWT service tokens with a private key.
All other services verify tokens locally using the issuer public key.

Current scope: Persistence and Redirect internal calls.

### Protocol

- Header `Authorization: Bearer <jwt>` is mandatory.
- Optional header `X-Service-Id` can be sent for diagnostics only.
- Authorization decisions are based on JWT claims, not on `X-Service-Id`.

### Token Contract

- Algorithm: asymmetric signing (RS256 or EdDSA).
- TTL: 3 minutes.
- Required claims: `iss`, `aud`, `sub` (service id), `iat`, `exp`, `jti`, `kid`.
- Expiration is trusted only because it is inside the signed payload.

### Key Distribution

- Issuer keeps private key secret.
- Issuer exposes read-only endpoint for public key retrieval (example: `/auth/public-key`).
- Verifier services cache the public key and refresh on startup, periodic timer, or signature mismatch.
- Full JWKS is deferred.

### Libraries (Node)

- `jose`: JWT signing and verification.
- `zod`: claim schema validation.
- `lru-cache`: in-memory public key cache.

### Rotation and Revocation

- Key rotation is coordinated.
- Minimal rotation flow:
1. Generate new key pair in issuer.
2. Publish new public key with new `kid`.
3. Start issuing tokens with new `kid`.
4. Keep previous public key until all old tokens expire.
5. Remove old key.
- Immediate revocation: stop issuing with compromised key and remove compromised public key after emergency window.

### Response Policy

- `401`: missing token, invalid signature, expired token, invalid claims.
- `403`: valid token but caller not allowed for endpoint.
- `404` for security-by-obscurity is deferred and not default.

## Flows

### Happy Path

1. Service A requests token from issuer.
2. Issuer returns signed JWT with 3-minute TTL.
3. Service A calls Service B with `Authorization: Bearer <jwt>`.
4. Service B verifies signature and claims using cached public key.
5. Service B evaluates endpoint authorization.
6. Request succeeds.

### Bad Path: Expired Token

1. Service B verifies token and sees `exp` is in the past.
2. Service B returns `401`.
3. Service A requests a new token from issuer.
4. Service A retries once.

### Bad Path: Invalid Signature or Wrong Key

1. Service B verification fails.
2. Service B refreshes public key from issuer.
3. If still invalid, return `401` and log event.

### Bad Path: Unauthorized Caller

1. Token is valid.
2. Caller service id is not allowed for endpoint.
3. Service B returns `403`.

## Observability

### Metrics

- `auth_requests_total` with labels: `status`, `outcome`, `target_service`, `route_group`.
- `auth_failures_total` with labels: `reason` (`invalid_signature`, `expired`, `bad_claims`, `policy_denied`).
- `token_issued_total` with labels: `issuer`, `caller_service`, `kid`, `outcome`.
- `token_issue_failures_total` with label: `reason`.

### Logging

- Log token issuance and verification events with: `trace_id`, `request_id`, `caller_service`, `target_service`, `route`, `kid`, `status_code`, `failure_reason`.
- Never log raw JWT, signature fragments, or `Authorization` header values.
- If token correlation is needed, log a non-reversible token fingerprint (HMAC-SHA256 with log secret, truncated digest).

### Alerts

- Alert on 401 spike against baseline (with minimum absolute threshold).
- Alert on 403 spike per caller service or route (policy drift or abuse indicator).

### Consequences

1. We must implement issuer, verifier middleware, public key cache, and rotation procedure.

**Good**:
- No per-request introspection call in normal path.
- Expiration cannot be tampered without breaking signature.
- 3-minute TTL reduces replay window versus long-lived static credentials.
- Simple enough for current scope and team capacity.
- Observability is safe by default (no credential material in logs).

**Bad**:
- More moving parts than static tokens.
- Key leak still requires incident response and coordinated rotation.
- Without JWKS, multi-key rollover is manual and more fragile.
- Stolen valid token can be replayed until expiration.

## Deferred Items

- Full JWKS endpoint with multiple active keys.
- mTLS-based workload identity.
- Distributed denylist for immediate token revocation by `jti`.