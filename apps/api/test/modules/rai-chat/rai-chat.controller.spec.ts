import { Test, TestingModule } from '@nestjs/testing';
import { RaiChatController } from '../../../src/modules/rai-chat/rai-chat.controller';
import { TenantContextService } from '../../../src/shared/tenant-context/tenant-context.service';
import { RaiChatRequestDto } from '../../../src/modules/rai-chat/dto/rai-chat.dto';
import { BadRequestException } from '@nestjs/common';
import { RaiChatService } from '../../../src/modules/rai-chat/rai-chat.service';
import { IdempotencyInterceptor } from '../../../src/shared/idempotency/idempotency.interceptor';
import { RedisService } from '../../../src/shared/redis/redis.service';

describe('RaiChatController', () => {
    let controller: RaiChatController;
    let tenantContextService: TenantContextService;
    let raiChatService: { handleChat: jest.Mock };

    beforeEach(async () => {
        raiChatService = {
            handleChat: jest.fn(),
        };
        const idempotencyInterceptor = {
            intercept: jest.fn((_: unknown, next: { handle: () => unknown }) => next.handle()),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RaiChatController],
            providers: [
                {
                    provide: TenantContextService,
                    useValue: {
                        getCompanyId: jest.fn(),
                    },
                },
                {
                    provide: RaiChatService,
                    useValue: raiChatService,
                },
                {
                    provide: RedisService,
                    useValue: {},
                },
            ],
        })
            .overrideInterceptor(IdempotencyInterceptor)
            .useValue(idempotencyInterceptor)
            .compile();

        controller = module.get<RaiChatController>(RaiChatController);
        tenantContextService = module.get<TenantContextService>(TenantContextService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should throw BadRequestException if companyId is missing', async () => {
        jest.spyOn(tenantContextService, 'getCompanyId').mockReturnValue(undefined);

        const dto: RaiChatRequestDto = { message: 'hello' };
        const user = { userId: 'u1' };

        await expect(controller.handleChat(dto, user)).rejects.toThrow(BadRequestException);
    });

    it('should return a deterministic response if companyId is present', async () => {
        const mockCompanyId = 'comp_123';
        jest.spyOn(tenantContextService, 'getCompanyId').mockReturnValue(mockCompanyId);
        raiChatService.handleChat.mockResolvedValue({
            text: 'Принял: test message\nroute: /dashboard',
            widgets: [
                {
                    type: 'Last24hChanges',
                    version: 1,
                    schemaVersion: '1.0.0',
                    payload: {},
                },
            ],
        });

        const dto: RaiChatRequestDto = {
            message: 'test message',
            workspaceContext: { route: '/dashboard' }
        };

        const user = { userId: 'u1' };
        const result = await controller.handleChat(dto, user);

        expect(result).toBeDefined();
        expect(result.text).toContain('Принял: test message');
        expect(result.text).toContain('route: /dashboard');
        expect(result.widgets).toHaveLength(1);
        expect(result.widgets[0].type).toBe('Last24hChanges');
        expect(raiChatService.handleChat).toHaveBeenCalledWith(dto, mockCompanyId, 'u1');
    });

    it('should work without workspaceContext', async () => {
        const mockCompanyId = 'comp_123';
        jest.spyOn(tenantContextService, 'getCompanyId').mockReturnValue(mockCompanyId);
        raiChatService.handleChat.mockResolvedValue({
            text: 'Принял: hello',
            widgets: [],
        });

        const dto: RaiChatRequestDto = { message: 'hello' };
        const user = { userId: 'u2' };
        const result = await controller.handleChat(dto, user);

        expect(result.text).toBe('Принял: hello');
        expect(raiChatService.handleChat).toHaveBeenCalledWith(dto, mockCompanyId, 'u2');
    });
});
