import z from "zod";

export type ConfigServiceFactory = typeof _factory;
export type ConfigService = ReturnType<ConfigServiceFactory>;

const _factory = <T extends z.ZodSchema<any>>(options: {
    env: NodeJS.ProcessEnv,
    schema: T
}) => {
    const getConfig = () => {
        const parsedConfig = options.schema.safeParse(options.env);

        if (!parsedConfig.success) {
            console.error("Invalid configuration:", parsedConfig.error.format());
            throw new Error("Invalid configuration");
        }

        return parsedConfig.data;
    }

    return {
        getConfig
    }
}

export default _factory;