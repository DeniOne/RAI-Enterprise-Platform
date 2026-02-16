import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import axiosRetry from 'axios-retry';

@Global()
@Module({
    imports: [
        HttpModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                timeout: 5000,
                maxRedirects: 3,
            }),
            inject: [ConfigService],
        }),
    ],
    exports: [HttpModule],
})
export class HttpResilienceModule {
    constructor() {
        // Configure global retry strategy for axios
        // This affects all HttpService usages imported from this module
        const axios = require('axios');
        axiosRetry(axios, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    error.response?.status === 429 ||
                    error.response?.status >= 500;
            }
        });
    }
}
