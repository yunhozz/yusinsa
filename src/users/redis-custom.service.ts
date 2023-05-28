import {Injectable} from "@nestjs/common";
import {RedisService} from "@liaoliaots/nestjs-redis";
import {Redis} from "ioredis";

@Injectable()
export class RedisCustomService {
    constructor(private redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    private readonly redis: Redis;

    async get(key: string): Promise<string> {
        return await this.redis.get(key);
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        await this.redis.set(key, value, 'EX', ttl);
    }
}