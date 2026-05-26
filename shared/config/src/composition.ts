import z from "zod";
import configServiceFactory from "./core/config.service";

const _factory = <T extends z.ZodSchema<any>>(env: NodeJS.ProcessEnv, schema: T) => {
    return configServiceFactory({ env, schema });
}

export default _factory;
