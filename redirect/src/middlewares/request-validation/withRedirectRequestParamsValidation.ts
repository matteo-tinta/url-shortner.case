import withZodValidation from "@url-shortner/http/src/middlewares/withZodValidation";
import { RedirectRequestParamsZodObject } from "@url-shortner/contracts";
import { Logger } from "@url-shortner/observability";

const _factory = (options: {
    logger: Logger
}) => withZodValidation({
    logger: options.logger,
    schema: RedirectRequestParamsZodObject,
    selector: (req) => req.params,
});

export default _factory;