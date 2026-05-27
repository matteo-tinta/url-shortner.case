import { Logger } from "../types/logger";

// A simple logger implementation that logs to the console. 
// This can be replaced with a more sophisticated logger if needed.
const _factory = () => {
    return {
        info: (message: string) => console.info(message),
        error: (message: string, error: unknown) => console.error(message, error),
    } as Logger;
}

export default _factory;