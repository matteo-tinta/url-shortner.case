import { default as createBaseLogger } from "./base.logger";

export type Logger = ReturnType<typeof createBaseLogger>["logger"];