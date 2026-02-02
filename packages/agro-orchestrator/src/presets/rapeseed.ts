// f:\RAI_EP\packages\agro-orchestrator\src\presets\rapeseed.ts
import { CanonicalStage } from '../types';

export const RAPESEED_DOMAIN = 'RAPESEED';

export const RapeseedPreset: CanonicalStage[] = [
    { id: '01_PRE_SOWING_ANALYSIS', order: 1, domain: RAPESEED_DOMAIN, name: 'Предшественник и анализ' },
    { id: '02_TILLAGE_MAIN', order: 2, domain: RAPESEED_DOMAIN, name: 'Основная обработка почвы' },
    { id: '03_SEEDBED_PREP', order: 3, domain: RAPESEED_DOMAIN, name: 'Предпосевная подготовка' },
    { id: '04_SOWING', order: 4, domain: RAPESEED_DOMAIN, name: 'Сев' },
    { id: '05_PROTECTION_EARLY', order: 5, domain: RAPESEED_DOMAIN, name: 'Уход за посевами (ранний)' },
    { id: '06_ROSETTE_FORMATION', order: 6, domain: RAPESEED_DOMAIN, name: 'Формирование розетки' },
    { id: '07_WINTER_PREP', order: 7, domain: RAPESEED_DOMAIN, name: 'Подготовка к зиме' },
    { id: '08_WINTER_MONITORING', order: 8, domain: RAPESEED_DOMAIN, name: 'Зимовка (Мониторинг)' },
    { id: '09_SPRING_RESTART', order: 9, domain: RAPESEED_DOMAIN, name: 'Возобновление вегетации' },
    { id: '10_STEM_ELONGATION', order: 10, domain: RAPESEED_DOMAIN, name: 'Стеблевание' },
    { id: '11_BUDDING', order: 11, domain: RAPESEED_DOMAIN, name: 'Бутонизация' },
    { id: '12_FLOWERING', order: 12, domain: RAPESEED_DOMAIN, name: 'Цветение' },
    { id: '13_POD_DEVELOPMENT', order: 13, domain: RAPESEED_DOMAIN, name: 'Образование стручков' },
    { id: '14_RIPENING', order: 14, domain: RAPESEED_DOMAIN, name: 'Созревание' },
    { id: '15_HARVESTING', order: 15, domain: RAPESEED_DOMAIN, name: 'Уборка' },
    { id: '16_SEASON_CLOSE', order: 16, domain: RAPESEED_DOMAIN, name: 'Закрытие сезона' }
];

export const getRapeseedStageById = (id: string): CanonicalStage | undefined => {
    return RapeseedPreset.find(s => s.id === id);
};
