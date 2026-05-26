//export composition
export { default as installObservability } from "./composition";
export * from "./composition";

//module exports
export { Logger } from "./loggers/logger.interface";
export { WithSpan } from "./hof/withSpan";

//factory exports
// export { default as createBaseLogger } from "./loggers/base.logger";
export { default as createRequestLogger } from "./loggers/request.logger";