import { Request, Response } from 'express';

const _factory = () => {
    const healthCheck = (req: Request, res: Response) => {
        res.status(200).json({ status: "ok" });
    }

    return {
        healthCheck,
    };
}

export default _factory;