import { Request, Response, NextFunction } from "express";

export const _createExpressRequestResponseNext = (opts?: {
    req?: Partial<Request>,
    res?: Partial<Response>
}) => {
    const {
        req: optReq = {},
        res: optRes = {}
    } = opts || {};

    const req = {
        body: {},
        ip: "127.0.0.1",
        ...optReq,
    };

    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    const res = {
        status: status,
        json: json,
        onceCalledWith: [],
        setHeader: vi.fn(),
        once: vi.fn((event: string, callback: () => void) => {
            if (event === "finish") {
                callback();
            }
        }),
        ...optRes
    };

    const next = vi.fn();

    return {
        req: req as unknown as Request,
        res: res as unknown as Response,
        next: next as unknown as NextFunction
    };
};