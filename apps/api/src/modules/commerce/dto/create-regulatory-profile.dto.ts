import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

// ─── rulesJson Zod-совместимая структура ─────────────────────────────────────
// Проценты хранятся как дробь (0.22 = 22%). Нормализация на уровне сервиса.

export type VatPayerStatus = "PAYER" | "NON_PAYER" | "USN_5" | "USN_7";
export type SupplyType = "GOODS" | "SERVICE" | "LEASE";
export type CurrencyCode = "RUB" | "BYN" | "KZT";

export interface RegulatoryRulesJson {
    vatRate: number;                  // 0.22 = 22%
    vatRateReduced?: number;          // 0.10 = 10%
    vatRateZero?: number;             // 0 = 0% экспорт
    crossBorderVatRate: number;       // Кросс-граничная ставка (обычно 0)
    vatPayerStatus: VatPayerStatus;   // Режим/лейбл плательщика
    supplyType: SupplyType;
    currencyCode: CurrencyCode;
    effectiveFrom: string;            // 'YYYY-MM-DD'
    effectiveTo?: string;             // 'YYYY-MM-DD' | null — для историчности
    notes?: string;
}

// ─── Вспомогательная нормализация % → дробь ──────────────────────────────────
export function normalizeVatRate(rate: number): number {
    // Если число > 1, считаем что пришло в % (22 → 0.22)
    return rate > 1 ? rate / 100 : rate;
}

// ─── DTO входящего rulesJson (проценты принимаем в % от пользователя) ─────────
export class RulesJsonInputDto {
    @IsNumber() @Min(0) @Max(100)
    vatRate!: number;

    @IsNumber() @Min(0) @Max(100) @IsOptional()
    vatRateReduced?: number;

    @IsNumber() @Min(0) @Max(100) @IsOptional()
    vatRateZero?: number;

    @IsNumber() @Min(0) @Max(100)
    crossBorderVatRate!: number;

    @IsString() @IsNotEmpty()
    vatPayerStatus!: VatPayerStatus;

    @IsString() @IsNotEmpty()
    supplyType!: SupplyType;

    @IsString() @IsNotEmpty()
    currencyCode!: CurrencyCode;

    @IsString() @IsNotEmpty()
    effectiveFrom!: string;

    @IsString() @IsOptional()
    effectiveTo?: string;

    @IsString() @IsOptional()
    notes?: string;
}

// ─── Create ──────────────────────────────────────────────────────────────────
export class CreateRegulatoryProfileDto {
    @IsString() @IsNotEmpty()
    code!: string;

    @IsString() @IsNotEmpty()
    name!: string;

    @IsString() @IsNotEmpty()
    jurisdictionId!: string;

    @IsOptional()
    rulesJson?: RulesJsonInputDto;
}

// ─── Update ──────────────────────────────────────────────────────────────────
export class UpdateRegulatoryProfileDto {
    @IsString() @IsOptional() @IsNotEmpty()
    name?: string;

    // code менять запрещено для isSystemPreset — проверяется в сервисе
    @IsString() @IsOptional() @IsNotEmpty()
    code?: string;

    @IsString() @IsOptional() @IsNotEmpty()
    jurisdictionId?: string;

    @IsOptional()
    rulesJson?: RulesJsonInputDto;
}

// ─── Query params ─────────────────────────────────────────────────────────────
export class ListRegulatoryProfilesQueryDto {
    @IsString() @IsOptional()
    jurisdictionId?: string;

    @IsBoolean() @IsOptional()
    includeSystemPresets?: boolean;

    @IsBoolean() @IsOptional()
    isSystemPreset?: boolean;
}
