import {Injectable, NotFoundException} from "@nestjs/common";
import {RedisService} from "@liaoliaots/nestjs-redis";
import {Redis} from "ioredis";

@Injectable()
export class RedisCustomService {
    constructor(private redisService: RedisService) {
        this.redis = this.redisService.getClient();
    }

    private readonly redis: Redis;

    async get(key: string): Promise<string> {
        const value = await this.redis.get(key);
        if (!value) {
            throw new NotFoundException(`redis 에 해당 key 에 대한 데이터가 없습니다 : ${key}`);
        }

        return value;
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        await this.redis.set(key, value, 'EX', ttl);
    }

    async delete(key: string): Promise<void> {
        const value = await this.get(key);
        await this.redis.set(key, value, 'PX', 1);
    }
}