import {
    formatAdvisoryLevelLabel,
    formatAiWidgetStatusLabel,
    formatCanonicalBranchLabel,
    formatComplianceStatusLabel,
    formatCropFormLabel,
    formatCropLabel,
    formatEvidenceTypeLabel,
    formatFrontOfficeChannelLabel,
    formatFrontOfficeClarificationLabel,
    formatFrontOfficeDirectionLabel,
    formatFrontOfficeIntentLabel,
    formatFrontOfficeOwnerLabel,
    formatFrontOfficeText,
    formatParityDiffCodeLabel,
    formatPriorityLabel,
    formatResourceUnitLabel,
    formatSoilTypeLabel,
    formatGovernanceKeyLabel,
    formatIngressSourceLabel,
    formatIncidentTypeLabel,
    formatObservationIntentLabel,
    formatObservationTypeLabel,
    formatTechExplainabilityMessage,
    formatTechMapBlockLabel,
    formatTechStageCodeLabel,
    formatStatusLabel,
    formatTargetMetricLabel,
    formatToolLabel,
    formatTrustLatencyProfileLabel,
} from '@/lib/ui-language';

describe('ui-language formatters', () => {
    it('переводит основные статусы в русский UI-вид', () => {
        expect(formatStatusLabel('DRAFT')).toBe('Черновик');
        expect(formatStatusLabel('IN_PROGRESS')).toBe('В работе');
        expect(formatStatusLabel('ACTIVE')).toBe('Активно');
    });

    it('переводит типы подтверждений и наблюдений', () => {
        expect(formatEvidenceTypeLabel('LAB_REPORT')).toBe('Лабораторный отчёт');
        expect(formatObservationTypeLabel('VOICE_NOTE')).toBe('Голосовая заметка');
        expect(formatObservationIntentLabel('CONSULTATION')).toBe('Консультация');
    });

    it('переводит статусы AI-виджетов и уровень advisory', () => {
        expect(formatAiWidgetStatusLabel('queued')).toBe('в очереди');
        expect(formatAiWidgetStatusLabel('in_progress')).toBe('в работе');
        expect(formatAdvisoryLevelLabel('HIGH')).toBe('высокий');
    });

    it('переводит governance и control-tower коды в русский UI-вид', () => {
        expect(formatGovernanceKeyLabel('READY_FOR_CANARY')).toBe('готово к канарейке');
        expect(formatGovernanceKeyLabel('ROLLBACK_RECOMMENDED')).toBe('рекомендован откат');
        expect(formatTrustLatencyProfileLabel('MULTI_SOURCE_READ')).toBe('чтение из нескольких источников');
        expect(formatIngressSourceLabel('semantic_route_primary')).toBe('основной семантический маршрут');
        expect(formatToolLabel('tools')).toBe('Инструменты');
        expect(formatToolLabel('register_counterparty')).toBe('Регистрация контрагента');
    });

    it('переводит security и compliance коды в русский UI-вид', () => {
        expect(formatIncidentTypeLabel('PII_LEAK')).toBe('Утечка персональных данных');
        expect(formatIncidentTypeLabel('QUALITY_BS_DRIFT')).toBe('Дрейф качества');
        expect(formatComplianceStatusLabel('Verified')).toBe('Подтверждено');
        expect(formatComplianceStatusLabel('Breach')).toBe('Нарушение');
    });

    it('переводит front-office intent, роли и текстовые хвосты в русский UI-вид', () => {
        expect(formatFrontOfficeIntentLabel('consultation')).toBe('Консультация');
        expect(formatFrontOfficeClarificationLabel('LINK_OBJECT')).toBe('Укажите объект хозяйства');
        expect(formatFrontOfficeChannelLabel('telegram')).toBe('Телеграм');
        expect(formatFrontOfficeDirectionLabel('inbound')).toBe('Входящее');
        expect(formatFrontOfficeOwnerLabel('contracts_agent')).toBe('Контрактный агент');
        expect(formatFrontOfficeOwnerLabel('ADMIN')).toBe('Администратор');
        expect(formatFrontOfficeText('Есть новый вопрос по договору для South Field Farm.')).toBe(
            'Есть новый вопрос по договору для хозяйства «Южное полевое хозяйство».',
        );
        expect(formatFrontOfficeText('Открыть /commerce/contracts и забрать handoff в работу.')).toBe(
            'Открыть раздел договоров и забрать передачу в работу.',
        );
    });

    it('переводит коды техкарт и видимые служебные значения в русский UI-вид', () => {
        expect(formatCropLabel('RAPESEED')).toBe('Рапс');
        expect(formatCropFormLabel('RAPESEED_WINTER')).toBe('Озимый рапс');
        expect(formatCanonicalBranchLabel('winter_rapeseed')).toBe('Озимый рапс');
        expect(formatTechMapBlockLabel('field_admission_check')).toBe('Проверка допуска поля');
        expect(formatTechStageCodeLabel('01_PRE_SOWING_ANALYSIS')).toBe('Предпосевной анализ');
        expect(formatResourceUnitLabel('unit')).toBe('ед.');
        expect(formatSoilTypeLabel('CHERNOZEM')).toBe('Чернозём');
        expect(formatTargetMetricLabel('YIELD_QPH')).toBe('Урожайность, ц/га');
    });

    it('нормализует explainability и parity сообщения без видимого английского', () => {
        expect(formatPriorityLabel('P1')).toBe('Приоритет 1');
        expect(formatParityDiffCodeLabel('stage:winter_dormancy')).toBe('Стадия: перезимовка');
        expect(formatTechExplainabilityMessage('Legacy blueprint не покрывает каноническую стадию Перезимовка.')).toBe(
            'Наследованный шаблон не покрывает каноническую стадию Перезимовка.',
        );
        expect(formatTechExplainabilityMessage('Нет значения S_available для rapeseed admission.')).toBe(
            'Не указано содержание доступной серы для проверки допуска рапса.',
        );
    });
});
