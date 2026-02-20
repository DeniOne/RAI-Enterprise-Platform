import { Module } from '@nestjs/common';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [RedisModule],
    providers: [IdempotencyInterceptor],
    exports: [IdempotencyInterceptor],
})
export class IdempotencyModule { }
