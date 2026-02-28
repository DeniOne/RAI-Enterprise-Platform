import { z } from 'zod';

// --- Вспомогательные схемы для массивов ---

export const AddressSchema = z.object({
    type: z.enum(['LEGAL', 'POSTAL', 'ACTUAL', 'DELIVERY'], {
        errorMap: () => ({ message: 'Выберите тип адреса' }),
    }),
    index: z.string().optional(),
    region: z.string().optional(),
    city: z.string().min(1, 'Город обязателен'),
    street: z.string().min(1, 'Улица/дом обязательны'),
});

export const BankAccountSchema = z.object({
    accountName: z.string().min(1, 'Название (напр. Основной)'),
    accountNumber: z.string().min(20, 'Р/с должен быть 20 знаков'),
    bic: z.string().min(9, 'БИК должен быть 9 знаков'),
    bankName: z.string().min(1, 'Название банка'),
    corrAccount: z.string().optional(),
    currency: z.string().default('RUB'),
    isPrimary: z.boolean().default(false),
});

export const ContactSchema = z.object({
    fullName: z.string().min(1, 'ФИО обязательно'),
    position: z.enum(['SIGNATORY', 'CEO', 'CHIEF_AGRONOMIST', 'AGRONOMIST', 'CHIEF_ACCOUNTANT', 'OTHER'], {
        errorMap: () => ({ message: 'Выберите должность' }),
    }),
    phone: z.string().optional(),
    email: z.string()
        .email('Некорректный email')
        .optional()
        .or(z.literal('')),
    isPrimary: z.boolean().default(false),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
});

// --- Вспомогательные схемы для связей ---

export const PartyRelationSchema = z.object({
    type: z.enum(['PARENT', 'CHILD', 'MANAGING', 'MANAGED'], {
        errorMap: () => ({ message: 'Выберите тип связи' }),
    }),
    relatedPartyId: z.string().min(1, 'Выберите контрагента'),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),
    share: z.number().min(0).max(100).optional().or(z.literal(0)),
});

export const AssetRelationSchema = z.object({
    assetId: z.string().min(1, 'Выберите хозяйство'),
    role: z.enum(['OWNER', 'TENANT', 'OPERATOR', 'PLEDGEE'], {
        errorMap: () => ({ message: 'Выберите роль' }),
    }),
    basis: z.string().min(1, 'Укажите основание (договор/свидетельство)'),
});

// --- Основные схемы форм ---

export const PartyQuickCreateSchema = z.object({
    jurisdictionId: z.enum(['RU', 'BY', 'KZ']),
    type: z.enum(['LEGAL_ENTITY', 'IP', 'KFH']),
    inn: z.string().min(9, 'ИНН/УНП слишком короткий'),
    legalName: z.string().min(1, 'Наименование обязательно'),
    kpp: z.string().optional(), // Добавлено для предзаполнения
});

export const PartyFullProfileSchema = z.object({
    legalName: z.string().min(1, 'Полное наименование обязательно'),
    shortName: z.string().optional(),
    inn: z.string().min(9, 'ИНН слишком короткий'),
    kpp: z.string().optional(),
    ogrn: z.string().optional(),
    jurisdictionId: z.string().min(1, 'Выберите юрисдикцию'),
    type: z.string().min(1, 'Выберите тип'),

    // Динамические массивы
    addresses: z.array(AddressSchema).default([]),
    bankAccounts: z.array(BankAccountSchema).default([]),
    contacts: z.array(ContactSchema).default([]),
    relations: z.array(PartyRelationSchema).default([]),
    assetRelations: z.array(AssetRelationSchema).default([]),
});

export type AddressValues = z.infer<typeof AddressSchema>;
export type BankAccountValues = z.infer<typeof BankAccountSchema>;
export type ContactValues = z.infer<typeof ContactSchema>;
export type PartyQuickCreateValues = z.infer<typeof PartyQuickCreateSchema>;
export type PartyFullProfileValues = z.infer<typeof PartyFullProfileSchema>;
