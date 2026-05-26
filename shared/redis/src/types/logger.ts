export type Logger = {
    info: (message: string) => void,
    error: (message: string, error: unknown) => void,
}