"use strict";
/**
 * Foundation Immersion Blocks
 * CANON v2.2: Mandatory Admission Scope
 *
 * These are NOT courses. They are fundamental distinct implementation units.
 * Users must "view" (audit log) all blocks before they can Accept the Foundation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOUNDATION_BLOCKS = exports.FoundationStatus = exports.FoundationBlockType = exports.FOUNDATION_VERSION = void 0;
exports.FOUNDATION_VERSION = 'v2.2-canon';
var FoundationBlockType;
(function (FoundationBlockType) {
    FoundationBlockType["CONSTITUTION"] = "CONSTITUTION";
    FoundationBlockType["CODEX"] = "CODEX";
    FoundationBlockType["GOLDEN_STANDARD"] = "GOLDEN_STANDARD";
    FoundationBlockType["ROLE_MODEL"] = "ROLE_MODEL";
    FoundationBlockType["MOTIVATION"] = "MOTIVATION";
})(FoundationBlockType || (exports.FoundationBlockType = FoundationBlockType = {}));
var FoundationStatus;
(function (FoundationStatus) {
    FoundationStatus["NOT_STARTED"] = "NOT_STARTED";
    FoundationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    FoundationStatus["ACCEPTED"] = "ACCEPTED";
    FoundationStatus["NOT_ACCEPTED"] = "NOT_ACCEPTED";
    FoundationStatus["VERSION_MISMATCH"] = "VERSION_MISMATCH";
})(FoundationStatus || (exports.FoundationStatus = FoundationStatus = {}));
exports.FOUNDATION_BLOCKS = [
    {
        id: FoundationBlockType.CONSTITUTION,
        materialId: 'foundation-block-1',
        title: 'Внутренняя Конституция',
        description: 'Высший Устав Компании. Права, Иерархия и Власть.',
        order: 1,
        mandatory: true
    },
    {
        id: FoundationBlockType.CODEX,
        materialId: 'foundation-block-2',
        title: 'Код поведения и антифрод',
        description: 'Кодекс Чести, борьба с мошенничеством и этические границы.',
        order: 2,
        mandatory: true
    },
    {
        id: FoundationBlockType.GOLDEN_STANDARD,
        materialId: 'foundation-block-3',
        title: 'Золотой Стандарт Фотоматрицы',
        description: 'Ценности: "Клиент — это Гость", Чистота, Скорость.',
        order: 3,
        mandatory: true
    },
    {
        id: FoundationBlockType.ROLE_MODEL,
        materialId: 'foundation-block-4',
        title: 'Ролевая модель и ответственность',
        description: 'Как работают Роли, Результаты и Зоны Ответственности.',
        order: 4,
        mandatory: true
    },
    {
        id: FoundationBlockType.MOTIVATION,
        materialId: 'foundation-block-5',
        title: 'Мотивация и последствия',
        description: 'Экономика Заслуг: MC, GMC и последствия нарушений.',
        order: 5,
        mandatory: true
    }
];
