export type Logger = {
    info: (_message: string) => void,
    error: (_message: string, _error: unknown) => void,
}