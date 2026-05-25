import withZodValidation from "@url-shortner/http/src/middlewares/withZodValidation";
import { RedirectRequestParamsZodObject } from "@url-shortner/contracts";

const _factory = () => withZodValidation(RedirectRequestParamsZodObject, (req) => req.params);

export default _factory;