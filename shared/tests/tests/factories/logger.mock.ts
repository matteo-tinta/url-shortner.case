export const _createMockedLogger = () => {
    const logger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
        child: vi.fn(),
    };

    logger.child.mockReturnValue(logger);

    return logger;
};
