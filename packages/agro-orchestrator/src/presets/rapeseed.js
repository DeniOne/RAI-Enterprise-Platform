"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRapeseedStageById = exports.RapeseedPreset = exports.RAPESEED_DOMAIN = void 0;
exports.RAPESEED_DOMAIN = 'RAPESEED';
exports.RapeseedPreset = [
    { id: '01_PRE_SOWING_ANALYSIS', order: 1, domain: exports.RAPESEED_DOMAIN, name: 'Предшественник и анализ' },
    { id: '02_TILLAGE_MAIN', order: 2, domain: exports.RAPESEED_DOMAIN, name: 'Основная обработка почвы' },
    { id: '03_SEEDBED_PREP', order: 3, domain: exports.RAPESEED_DOMAIN, name: 'Предпосевная подготовка' },
    { id: '04_SOWING', order: 4, domain: exports.RAPESEED_DOMAIN, name: 'Сев' },
    { id: '05_PROTECTION_EARLY', order: 5, domain: exports.RAPESEED_DOMAIN, name: 'Уход за посевами (ранний)' },
    { id: '06_ROSETTE_FORMATION', order: 6, domain: exports.RAPESEED_DOMAIN, name: 'Формирование розетки' },
    { id: '07_WINTER_PREP', order: 7, domain: exports.RAPESEED_DOMAIN, name: 'Подготовка к зиме' },
    { id: '08_WINTER_MONITORING', order: 8, domain: exports.RAPESEED_DOMAIN, name: 'Зимовка (Мониторинг)' },
    { id: '09_SPRING_RESTART', order: 9, domain: exports.RAPESEED_DOMAIN, name: 'Возобновление вегетации' },
    { id: '10_STEM_ELONGATION', order: 10, domain: exports.RAPESEED_DOMAIN, name: 'Стеблевание' },
    { id: '11_BUDDING', order: 11, domain: exports.RAPESEED_DOMAIN, name: 'Бутонизация' },
    { id: '12_FLOWERING', order: 12, domain: exports.RAPESEED_DOMAIN, name: 'Цветение' },
    { id: '13_POD_DEVELOPMENT', order: 13, domain: exports.RAPESEED_DOMAIN, name: 'Образование стручков' },
    { id: '14_RIPENING', order: 14, domain: exports.RAPESEED_DOMAIN, name: 'Созревание' },
    { id: '15_HARVESTING', order: 15, domain: exports.RAPESEED_DOMAIN, name: 'Уборка' },
    { id: '16_SEASON_CLOSE', order: 16, domain: exports.RAPESEED_DOMAIN, name: 'Закрытие сезона' }
];
const getRapeseedStageById = (id) => {
    return exports.RapeseedPreset.find(s => s.id === id);
};
exports.getRapeseedStageById = getRapeseedStageById;
//# sourceMappingURL=rapeseed.js.map