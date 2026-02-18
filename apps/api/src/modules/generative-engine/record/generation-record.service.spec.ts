import { Test, TestingModule } from '@nestjs/testing';
import { GenerationRecordService } from './generation-record.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

import { CanonicalSorter } from '../deterministic/canonical-sorter';
import { StableHasher } from '../deterministic/stable-hasher';

describe('GenerationRecordService', () => {
    let service: GenerationRecordService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GenerationRecordService,
                {
                    provide: PrismaService,
                    useValue: {
                        generationRecord: {
                            create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: CanonicalSorter,
                    useValue: {
                        canonicalize: jest.fn().mockReturnValue('{}'),
                    },
                },
                {
                    provide: StableHasher,
                    useValue: {
                        hashGeneration: jest.fn().mockReturnValue('h1'), // Matches default draft hash
                    },
                },
            ],
        }).compile();

        service = module.get<GenerationRecordService>(GenerationRecordService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    describe('createRecord', () => {
        it('должен создавать запись в БД', async () => {
            const draft: any = {
                status: 'GENERATED_DRAFT',
                stages: [{}],
                companyId: 'c1',
                generationMetadata: { hash: 'h1', seed: 's1', modelId: 'm1', modelVersion: '1.0' }
            };
            const payload = '{"a":1}';
            const inputParams = { a: 1 };

            await service.createRecord(draft, payload, inputParams, { summary: 'report' });

            expect(prisma.generationRecord.create).toHaveBeenCalled();
        });

        it.skip('должен обрабатывать ошибки дубликатов (P2002)', async () => {
            const draft: any = {
                status: 'GENERATED_DRAFT',
                stages: [{}],
                companyId: 'c1',
                generationMetadata: { hash: 'h1', seed: 's1', modelId: 'm1', modelVersion: '1.0' }
            };
            (prisma.generationRecord.create as jest.Mock).mockImplementation(() => {
                throw { code: 'P2002', message: 'Record already exists' };
            });

            await expect(service.createRecord(draft, '{"p":1}', { p: 1 }, null))
                .rejects.toThrow();
        });
    });


});
