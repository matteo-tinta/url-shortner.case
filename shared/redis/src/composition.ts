//Redis
import { default as createRedisClient } from "./services/redis.client";
import { default as redisServiceFactory } from "./services/redis.service";
import { default as createLogger } from "./services/logger.service";

import { Logger } from "./types/logger";

const _factory = (options: {
    url: string,
    logger?: Logger
}) => {
    const logger = options.logger || createLogger();
    const { redisClient } = createRedisClient({
        url: options.url,
        logger
    });

    const redisService = redisServiceFactory({
        client: redisClient,
        logger
    });

    const initialize = async () => {
        await redisClient.connect();
    }

    const shutdown = async () => {
        await redisClient.quit();
    }

    return {
        client: redisClient,
        service: redisService,
        initialize,
        shutdown
    }
}

export default _factory;