import { Test, TestingModule } from '@nestjs/testing';
import { PersonnelOrderService } from '../services/personnel-order.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PersonnelOrderService', () => {
    let service: PersonnelOrderService;
    let prisma: PrismaService;
    let hrEventService: HRDomainEventService;

    const mockPrisma = {
        personnelOrder: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockHREventService = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PersonnelOrderService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: HRDomainEventService, useValue: mockHREventService },
            ],
        }).compile();

        service = module.get<PersonnelOrderService>(PersonnelOrderService);
        prisma = module.get<PrismaService>(PrismaService);
        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create personnel order and emit ORDER_CREATED event', async () => {
            const mockOrder = {
                id: 'order-1',
                personalFileId: 'file-1',
                orderType: 'HIRING',
                orderNumber: 'HIR-2026-0001',
                title: 'Hiring Order',
                content: 'Hire John Doe',
                status: 'DRAFT',
            };

            mockPrisma.personnelOrder.count.mockResolvedValue(0);
            mockPrisma.personnelOrder.create.mockResolvedValue(mockOrder);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.create(
                'file-1',
                'HIRING',
                {
                    title: 'Hiring Order',
                    content: 'Hire John Doe',
                    orderDate: new Date('2026-01-22'),
                    effectiveDate: new Date('2026-02-01'),
                },
                'user-1',
                'HR_MANAGER'
            );

            expect(result).toEqual(mockOrder);
            expect(mockPrisma.personnelOrder.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    personalFileId: 'file-1',
                    orderType: 'HIRING',
                    orderNumber: 'HIR-2026-0001',
                    status: 'DRAFT',
                }),
            });
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'ORDER_CREATED',
                aggregateType: 'PERSONNEL_ORDER',
                aggregateId: 'order-1',
                actorId: 'user-1',
                actorRole: 'HR_MANAGER',
                payload: expect.any(Object),
                newState: { status: 'DRAFT' },
            });
        });
    });

    describe('sign', () => {
        it('should sign order and emit ORDER_SIGNED event', async () => {
            const mockOrder = {
                id: 'order-1',
                status: 'APPROVED',
                orderNumber: 'HIR-2026-0001',
                orderType: 'HIRING',
            };

            const mockSignedOrder = {
                ...mockOrder,
                status: 'SIGNED',
                signedById: 'director-1',
                signedAt: new Date(),
            };

            mockPrisma.personnelOrder.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.personnelOrder.update.mockResolvedValue(mockSignedOrder);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.sign('order-1', 'director-1', 'DIRECTOR');

            expect(result).toEqual(mockSignedOrder);
            expect(mockPrisma.personnelOrder.update).toHaveBeenCalledWith({
                where: { id: 'order-1' },
                data: {
                    status: 'SIGNED',
                    signedById: 'director-1',
                    signedAt: expect.any(Date),
                },
            });
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'ORDER_SIGNED',
                aggregateType: 'PERSONNEL_ORDER',
                aggregateId: 'order-1',
                actorId: 'director-1',
                actorRole: 'DIRECTOR',
                payload: expect.any(Object),
                previousState: { status: 'APPROVED' },
                newState: { status: 'SIGNED' },
                legalBasis: expect.any(String),
            });
        });

        it('should throw NotFoundException if order not found', async () => {
            mockPrisma.personnelOrder.findUnique.mockResolvedValue(null);

            await expect(
                service.sign('invalid-id', 'director-1', 'DIRECTOR')
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if order already signed', async () => {
            mockPrisma.personnelOrder.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'SIGNED',
            });

            await expect(
                service.sign('order-1', 'director-1', 'DIRECTOR')
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('cancel', () => {
        it('should cancel order and emit ORDER_CANCELLED event', async () => {
            const mockOrder = {
                id: 'order-1',
                status: 'DRAFT',
                orderNumber: 'HIR-2026-0001',
            };

            const mockCancelledOrder = {
                ...mockOrder,
                status: 'CANCELLED',
            };

            mockPrisma.personnelOrder.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.personnelOrder.update.mockResolvedValue(mockCancelledOrder);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.cancel(
                'order-1',
                'Not needed',
                'hr-1',
                'HR_MANAGER'
            );

            expect(result).toEqual(mockCancelledOrder);
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'ORDER_CANCELLED',
                aggregateType: 'PERSONNEL_ORDER',
                aggregateId: 'order-1',
                actorId: 'hr-1',
                actorRole: 'HR_MANAGER',
                payload: expect.objectContaining({
                    reason: 'Not needed',
                }),
                previousState: { status: 'DRAFT' },
                newState: { status: 'CANCELLED' },
            });
        });

        it('should throw ForbiddenException if trying to cancel signed order', async () => {
            mockPrisma.personnelOrder.findUnique.mockResolvedValue({
                id: 'order-1',
                status: 'SIGNED',
            });

            await expect(
                service.cancel('order-1', 'reason', 'hr-1', 'HR_MANAGER')
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('findById', () => {
        it('should return order with related data', async () => {
            const mockOrder = {
                id: 'order-1',
                orderNumber: 'HIR-2026-0001',
                personalFile: {
                    id: 'file-1',
                    employee: { id: 'emp-1', name: 'John Doe' },
                },
            };

            mockPrisma.personnelOrder.findUnique.mockResolvedValue(mockOrder);

            const result = await service.findById('order-1');

            expect(result).toEqual(mockOrder);
            expect(mockPrisma.personnelOrder.findUnique).toHaveBeenCalledWith({
                where: { id: 'order-1' },
                include: {
                    personalFile: {
                        include: {
                            employee: true,
                        },
                    },
                },
            });
        });

        it('should throw NotFoundException if order not found', async () => {
            mockPrisma.personnelOrder.findUnique.mockResolvedValue(null);

            await expect(service.findById('invalid-id')).rejects.toThrow(
                NotFoundException
            );
        });
    });
});
