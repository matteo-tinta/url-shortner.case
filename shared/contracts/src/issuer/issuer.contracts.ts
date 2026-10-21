import z from "zod";

export const TokenRequestZodObject = z.object({
    sub: z.string().min(1),
    aud: z.string().min(1),
});

export type TokenRequest = z.infer<typeof TokenRequestZodObject>;

export const TokenResponseZodObject = z.object({
    token: z.string(),
    expiresAt: z.number(),
});

export type TokenResponse = z.infer<typeof TokenResponseZodObject>;

export const PublicKeyResponseZodObject = z.object({
    kid: z.string().min(1),
    publicKey: z.string().min(1),
});

export type PublicKeyResponse = z.infer<typeof PublicKeyResponseZodObject>;

export const ServiceJwtClaimsZodObject = z.object({
    iss: z.string().min(1),
    aud: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    sub: z.string().min(1),
    iat: z.number(),
    exp: z.number(),
    jti: z.string().min(1),
});

export type ServiceJwtClaims = z.infer<typeof ServiceJwtClaimsZodObject>;

export const ServiceAuthContextZodObject = z.object({
    iss: z.string().min(1),
    aud: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    sub: z.string().min(1),
    jti: z.string().min(1),
    kid: z.string().min(1),
});

export type ServiceAuthContext = z.infer<typeof ServiceAuthContextZodObject>;
