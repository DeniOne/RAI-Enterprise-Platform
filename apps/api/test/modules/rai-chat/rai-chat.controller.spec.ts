import { Test, TestingModule } from '@nestjs/testing';
import { RaiChatController } from '../../../src/modules/rai-chat/rai-chat.controller';
import { TenantContextService } from '../../../src/shared/tenant-context/tenant-context.service';
import { RaiChatRequestDto } from '../../../src/modules/rai-chat/dto/rai-chat.dto';
import { BadRequestException } from '@nestjs/common';

describe('RaiChatController', () => {
    let controller: RaiChatController;
    let tenantContextService: TenantContextService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RaiChatController],
            providers: [
                {
                    provide: TenantContextService,
                    useValue: {
                        getCompanyId: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<RaiChatController>(RaiChatController);
        tenantContextService = module.get<TenantContextService>(TenantContextService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should throw BadRequestException if companyId is missing', async () => {
        jest.spyOn(tenantContextService, 'getCompanyId').mockReturnValue(undefined);

        const dto: RaiChatRequestDto = { message: 'hello' };

        await expect(controller.handleChat(dto)).rejects.toThrow(BadRequestException);
    });

    it('should return a deterministic response if companyId is present', async () => {
        const mockCompanyId = 'comp_123';
        jest.spyOn(tenantContextService, 'getCompanyId').mockReturnValue(mockCompanyId);

        const dto: RaiChatRequestDto = {
            message: 'test message',
            workspaceContext: { route: '/dashboard' }
        };

        const result = await controller.handleChat(dto);

        expect(result).toBeDefined();
        expect(result.text).toContain('Принял: test message');
        expect(result.text).toContain('route: /dashboard');
        expect(result.widgets).toHaveLength(1);
        expect(result.widgets[0].type).toBe('Last24hChanges');
    });

    it('should work without workspaceContext', async () => {
        const mockCompanyId = 'comp_123';
        jest.spyOn(tenantContextService, 'getCompanyId').mockReturnValue(mockCompanyId);

        const dto: RaiChatRequestDto = { message: 'hello' };

        const result = await controller.handleChat(dto);

        expect(result.text).toBe('Принял: hello');
    });
});
