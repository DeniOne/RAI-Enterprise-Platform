import { IdentificationSchemaService } from './identification-schema.service';

describe('IdentificationSchemaService', () => {
  const prisma = {
    jurisdiction: {
      findFirst: jest.fn(),
    },
  } as any;

  const service = new IdentificationSchemaService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('RU schema не содержит unp и bin', async () => {
    prisma.jurisdiction.findFirst.mockResolvedValue({ code: 'RU' });
    const schema = await service.getSchema('cmp-1', 'jur-ru', 'LEGAL_ENTITY');
    expect(schema.fields.map((field) => field.key)).toEqual(['inn', 'kpp']);
    expect(schema.fields.some((field) => field.key === 'unp' || field.key === 'bin')).toBe(false);
  });

  it('BY schema содержит только unp', async () => {
    prisma.jurisdiction.findFirst.mockResolvedValue({ code: 'BY' });
    const schema = await service.getSchema('cmp-1', 'jur-by', 'LEGAL_ENTITY');
    expect(schema.fields.map((field) => field.key)).toEqual(['unp']);
  });

  it('KZ schema содержит только bin', async () => {
    prisma.jurisdiction.findFirst.mockResolvedValue({ code: 'KZ' });
    const schema = await service.getSchema('cmp-1', 'jur-kz', 'LEGAL_ENTITY');
    expect(schema.fields.map((field) => field.key)).toEqual(['bin']);
  });
});
