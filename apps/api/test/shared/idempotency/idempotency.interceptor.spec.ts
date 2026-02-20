import { CallHandler, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { IdempotencyInterceptor } from '../../../src/shared/idempotency/idempotency.interceptor';
import { RedisService } from '../../../src/shared/redis/redis.service';
import { of, throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('IdempotencyInterceptor', () => {
    let interceptor: IdempotencyInterceptor;
    let redisServiceMock: jest.Mocked<Partial<RedisService>>;
    let contextMock: jest.Mocked<ExecutionContext>;
    let callHandlerMock: jest.Mocked<CallHandler>;

    beforeEach(() => {
        redisServiceMock = {
            get: jest.fn(),
            setNX: jest.fn(),
            set: jest.fn(),
        };

        interceptor = new IdempotencyInterceptor(redisServiceMock as unknown as RedisService);

        contextMock = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn(),
            }),
        } as unknown as jest.Mocked<ExecutionContext>;

        callHandlerMock = {
            handle: jest.fn(),
        };
    });

    it('should pass through GET requests', async () => {
        (contextMock.switchToHttp().getRequest as jest.Mock).mockReturnValue({
            method: 'GET',
        });
        callHandlerMock.handle.mockReturnValue(of('response'));

        const result = await lastValueFrom(await interceptor.intercept(contextMock, callHandlerMock));
        expect(result).toEqual('response');
        expect(redisServiceMock.get).not.toHaveBeenCalled();
    });

    it('should throw error if Idempotency-Key is missing on POST', async () => {
        (contextMock.switchToHttp().getRequest as jest.Mock).mockReturnValue({
            method: 'POST',
            headers: {},
        });

        await expect(interceptor.intercept(contextMock, callHandlerMock)).rejects.toThrow(HttpException);
        await expect(interceptor.intercept(contextMock, callHandlerMock)).rejects.toHaveProperty('status', HttpStatus.BAD_REQUEST);
    });

    it('should return cached response if COMPLETED', async () => {
        (contextMock.switchToHttp().getRequest as jest.Mock).mockReturnValue({
            method: 'POST',
            headers: { 'idempotency-key': 'test-key' },
        });

        redisServiceMock.get.mockResolvedValueOnce(JSON.stringify({ status: 'COMPLETED', response: 'cached-data' }));

        const result = await lastValueFrom(await interceptor.intercept(contextMock, callHandlerMock));
        expect(result).toEqual('cached-data');
        expect(callHandlerMock.handle).not.toHaveBeenCalled();
    });

    it('should throw CONFLICT if IN_PROGRESS', async () => {
        (contextMock.switchToHttp().getRequest as jest.Mock).mockReturnValue({
            method: 'POST',
            headers: { 'idempotency-key': 'test-key' },
        });

        redisServiceMock.get.mockResolvedValueOnce(JSON.stringify({ status: 'IN_PROGRESS' }));

        await expect(interceptor.intercept(contextMock, callHandlerMock)).rejects.toThrow(HttpException);
        await expect(interceptor.intercept(contextMock, callHandlerMock)).rejects.toHaveProperty('status', HttpStatus.CONFLICT);
    });

    it('should proceed and cache response if key is new', async () => {
        (contextMock.switchToHttp().getRequest as jest.Mock).mockReturnValue({
            method: 'POST',
            headers: { 'idempotency-key': 'new-key' },
        });

        redisServiceMock.get.mockResolvedValueOnce(null);
        redisServiceMock.setNX.mockResolvedValueOnce(true);
        callHandlerMock.handle.mockReturnValue(of({ success: true }));

        const result = await lastValueFrom(await interceptor.intercept(contextMock, callHandlerMock));
        expect(result).toEqual({ success: true });

        expect(redisServiceMock.setNX).toHaveBeenCalledWith('idempotency:new-key', expect.stringContaining('IN_PROGRESS'), 120);
        expect(redisServiceMock.set).toHaveBeenCalledWith('idempotency:new-key', expect.stringContaining('COMPLETED'), 86400);
    });

    it('should throw CONFLICT if setNX fails (race condition)', async () => {
        (contextMock.switchToHttp().getRequest as jest.Mock).mockReturnValue({
            method: 'POST',
            headers: { 'idempotency-key': 'new-key' },
        });

        redisServiceMock.get.mockResolvedValueOnce(null);
        redisServiceMock.setNX.mockResolvedValueOnce(false); // Some other thread got it

        await expect(interceptor.intercept(contextMock, callHandlerMock)).rejects.toThrow(HttpException);
        await expect(interceptor.intercept(contextMock, callHandlerMock)).rejects.toHaveProperty('status', HttpStatus.CONFLICT);
        expect(callHandlerMock.handle).not.toHaveBeenCalled();
    });
});
