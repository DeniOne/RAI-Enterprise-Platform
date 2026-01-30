import { Test, TestingModule } from '@nestjs/testing';
import { LaborContractService } from '../services/labor-contract.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HRDomainEventService } from '../services/hr-domain-event.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('LaborContractService', () => {
    let service: LaborContractService;
    let prisma: PrismaService;
    let hrEventService: HRDomainEventService;

    const mockPrisma = {
        laborContract: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        contractAmendment: {
            create: jest.fn(),
            count: jest.fn(),
        },
    };

    const mockHREventService = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LaborContractService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: HRDomainEventService, useValue: mockHREventService },
            ],
        }).compile();

        service = module.get<LaborContractService>(LaborContractService);
        prisma = module.get<PrismaService>(PrismaService);
        hrEventService = module.get<HRDomainEventService>(HRDomainEventService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create labor contract and emit CONTRACT_SIGNED event', async () => {
            const mockContract = {
                id: 'contract-1',
                personalFileId: 'file-1',
                contractNumber: 'LC-2026-00001',
                contractType: 'INDEFINITE',
                status: 'ACTIVE',
                salary: 100000,
            };

            mockPrisma.laborContract.findFirst.mockResolvedValue(null); // No existing active contract
            mockPrisma.laborContract.count.mockResolvedValue(0);
            mockPrisma.laborContract.create.mockResolvedValue(mockContract);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.create(
                'file-1',
                {
                    contractType: 'INDEFINITE' as any,
                    contractDate: new Date('2026-01-22'),
                    startDate: new Date('2026-02-01'),
                    positionId: 'pos-1',
                    departmentId: 'dept-1',
                    salary: 100000,
                    workSchedule: '5/2',
                },
                'hr-1',
                'HR_MANAGER'
            );

            expect(result).toEqual(mockContract);
            expect(mockPrisma.laborContract.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    personalFileId: 'file-1',
                    contractType: 'INDEFINITE',
                    status: 'ACTIVE',
                    salary: 100000,
                }),
            });
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'CONTRACT_SIGNED',
                aggregateType: 'LABOR_CONTRACT',
                aggregateId: 'contract-1',
                actorId: 'hr-1',
                actorRole: 'HR_MANAGER',
                payload: expect.any(Object),
                newState: { status: 'ACTIVE' },
                legalBasis: expect.any(String),
            });
        });

        it('should throw BadRequestException if employee already has active contract', async () => {
            mockPrisma.laborContract.findFirst.mockResolvedValue({
                id: 'existing-contract',
                status: 'ACTIVE',
            });

            await expect(
                service.create(
                    'file-1',
                    {
                        contractType: 'INDEFINITE' as any,
                        contractDate: new Date(),
                        startDate: new Date(),
                        positionId: 'pos-1',
                        departmentId: 'dept-1',
                        salary: 100000,
                        workSchedule: '5/2',
                    },
                    'hr-1',
                    'HR_MANAGER'
                )
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('createAmendment', () => {
        it('should create contract amendment and emit CONTRACT_AMENDED event', async () => {
            const mockContract = {
                id: 'contract-1',
                status: 'ACTIVE',
            };

            const mockAmendment = {
                id: 'amendment-1',
                contractId: 'contract-1',
                amendmentNumber: 1,
                changes: { salary: 120000 },
            };

            mockPrisma.laborContract.findUnique.mockResolvedValue(mockContract);
            mockPrisma.contractAmendment.count.mockResolvedValue(0);
            mockPrisma.contractAmendment.create.mockResolvedValue(mockAmendment);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.createAmendment(
                'contract-1',
                { salary: 120000 },
                'hr-1',
                'HR_MANAGER'
            );

            expect(result).toEqual(mockAmendment);
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'CONTRACT_AMENDED',
                aggregateType: 'LABOR_CONTRACT',
                aggregateId: 'contract-1',
                actorId: 'hr-1',
                actorRole: 'HR_MANAGER',
                payload: expect.objectContaining({
                    amendmentNumber: 1,
                    changes: { salary: 120000 },
                }),
                legalBasis: expect.any(String),
            });
        });

        it('should throw NotFoundException if contract not found', async () => {
            mockPrisma.laborContract.findUnique.mockResolvedValue(null);

            await expect(
                service.createAmendment('invalid-id', {}, 'hr-1', 'HR_MANAGER')
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if contract not active', async () => {
            mockPrisma.laborContract.findUnique.mockResolvedValue({
                id: 'contract-1',
                status: 'TERMINATED',
            });

            await expect(
                service.createAmendment('contract-1', {}, 'hr-1', 'HR_MANAGER')
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('terminate', () => {
        it('should terminate contract and emit CONTRACT_TERMINATED event (DIRECTOR only)', async () => {
            const mockContract = {
                id: 'contract-1',
                status: 'ACTIVE',
                contractNumber: 'LC-2026-00001',
            };

            const mockTerminated = {
                ...mockContract,
                status: 'TERMINATED',
                terminationDate: new Date('2026-12-31'),
                terminationReason: 'Resignation',
            };

            mockPrisma.laborContract.findUnique.mockResolvedValue(mockContract);
            mockPrisma.laborContract.update.mockResolvedValue(mockTerminated);
            mockHREventService.emit.mockResolvedValue(undefined);

            const result = await service.terminate(
                'contract-1',
                'Resignation',
                new Date('2026-12-31'),
                'director-1',
                'DIRECTOR'
            );

            expect(result).toEqual(mockTerminated);
            expect(mockHREventService.emit).toHaveBeenCalledWith({
                eventType: 'CONTRACT_TERMINATED',
                aggregateType: 'LABOR_CONTRACT',
                aggregateId: 'contract-1',
                actorId: 'director-1',
                actorRole: 'DIRECTOR', // CRITICAL: Only DIRECTOR can terminate
                payload: expect.objectContaining({
                    reason: 'Resignation',
                }),
                previousState: { status: 'ACTIVE' },
                newState: { status: 'TERMINATED' },
                legalBasis: expect.any(String),
            });
        });

        it('should throw BadRequestException if contract not active', async () => {
            mockPrisma.laborContract.findUnique.mockResolvedValue({
                id: 'contract-1',
                status: 'TERMINATED',
            });

            await expect(
                service.terminate(
                    'contract-1',
                    'reason',
                    new Date(),
                    'director-1',
                    'DIRECTOR'
                )
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('findExpiring', () => {
        it('should return expiring fixed-term contracts', async () => {
            const mockContracts = [
                {
                    id: 'contract-1',
                    contractType: 'FIXED_TERM',
                    status: 'ACTIVE',
                    endDate: new Date('2026-02-15'),
                    personalFile: {
                        employee: { id: 'emp-1', name: 'John Doe' },
                    },
                },
            ];

            mockPrisma.laborContract.findMany.mockResolvedValue(mockContracts);

            const result = await service.findExpiring(30);

            expect(result).toEqual(mockContracts);
            expect(mockPrisma.laborContract.findMany).toHaveBeenCalledWith({
                where: {
                    contractType: 'FIXED_TERM',
                    status: 'ACTIVE',
                    endDate: {
                        lte: expect.any(Date),
                        gte: expect.any(Date),
                    },
                },
                include: expect.any(Object),
            });
        });
    });
});
