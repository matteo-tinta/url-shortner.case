import createRedisService from "../../src/services/redis.service";

const _createMockClient = () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    INCR: vi.fn(),
    DECR: vi.fn(),
    expire: vi.fn(),
    zAdd: vi.fn(),
    zCard: vi.fn(),
    zRemRangeByScore: vi.fn(),
    zRangeWithScores: vi.fn(),
    watch: vi.fn(),
    unwatch: vi.fn(),
    multi: vi.fn(),
});

const _createMockLogger = () => ({
    info: vi.fn(),
    error: vi.fn(),
});

describe("RedisService", () => {
    it("get should delegate to client.get and return the value", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.get.mockResolvedValue("stored-value");

        //Act
        const result = await service.get("my-key");

        //Assert
        expect(client.get).toHaveBeenCalledWith("my-key");
        expect(result).toBe("stored-value");
    });

    it("get should wrap client errors as 'Internal Server Error'", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.get.mockRejectedValue(new Error("Connection refused"));

        //Act & Assert
        await expect(service.get("my-key")).rejects.toThrow("Internal Server Error");
        expect(logger.error).toHaveBeenCalled();
    });

    it("set should delegate to client.set with value and options", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.set.mockResolvedValue("OK");

        //Act
        const result = await service.set("my-key", "my-value", { EX: 60 });

        //Assert
        expect(client.set).toHaveBeenCalledWith("my-key", "my-value", { EX: 60 });
        expect(result).toBe("OK");
    });

    it("set should wrap client errors as 'Internal Server Error'", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.set.mockRejectedValue(new Error("READONLY You can't write against a read only replica."));

        //Act & Assert
        await expect(service.set("my-key", "my-value")).rejects.toThrow("Internal Server Error");
    });

    it("zAdd should delegate to client.zAdd with member", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        const member = { score: 1234567890, value: "entry:1234567890" };
        client.zAdd.mockResolvedValue(1);

        //Act
        const result = await service.zAdd("my-set", member);

        //Assert
        expect(client.zAdd).toHaveBeenCalledWith("my-set", member);
        expect(result).toBe(1);
    });

    it("zCard should return count of sorted set members", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.zCard.mockResolvedValue(5);

        //Act
        const result = await service.zCard("my-set");

        //Assert
        expect(client.zCard).toHaveBeenCalledWith("my-set");
        expect(result).toBe(5);
    });

    it("zRemRangeByScore should delegate to client with min/max bounds", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.zRemRangeByScore.mockResolvedValue(3);

        //Act
        const result = await service.zRemRangeByScore("my-set", "-inf", 1000);

        //Assert
        expect(client.zRemRangeByScore).toHaveBeenCalledWith("my-set", "-inf", 1000);
        expect(result).toBe(3);
    });

    it("del should delegate to client.del", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.del.mockResolvedValue(1);

        //Act
        const result = await service.del("my-key");

        //Assert
        expect(client.del).toHaveBeenCalledWith("my-key");
        expect(result).toBe(1);
    });

    it("expire should delegate to client.expire", async () => {
        //Arrange
        const client = _createMockClient();
        const logger = _createMockLogger();
        const service = createRedisService({ client: client as any, logger });
        client.expire.mockResolvedValue(1);

        //Act
        const result = await service.expire("my-key", 300);

        //Assert
        expect(client.expire).toHaveBeenCalledWith("my-key", 300);
        expect(result).toBe(1);
    });
});
