import { Request, Response } from 'express';

const _factory = () => {
    const healthCheck = () => {
        //do nothing
    };

    return {
        healthCheck,
    };
}

export default _factory;