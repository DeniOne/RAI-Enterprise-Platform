/**
 * Store Service Interface
 * Module 08 — MatrixCoin-Economy
 * 
 * ⚠️ STRUCTURE ONLY: Этот файл определяет интерфейс, НЕ реализацию.
 * Реализация запрещена до STEP 3.
 * 
 * ⚠️ GUARD: Store — немонетарный обмен, не магазин
 */

import { StoreItemCategory } from '../core/economy.enums';

/**
 * Store Item — объект в Store
 * ⚠️ GUARD: Нет цены в денежном эквиваленте
 */
export interface IStoreItem {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    /** Категория (символическая, не финансовая) */
    readonly category: StoreItemCategory;

    /** 
     * Стоимость в MC
     * ⚠️ GUARD: Это НЕ цена, а "смысловой эквивалент участия"
     */
    readonly mcCost: number;

    /** Доступен для обмена? */
    readonly isAvailable: boolean;

    /** Ограниченное количество? */
    readonly stock: number | null;
}

/**
 * Интерфейс Store-сервиса
 */
export interface IStoreService {
    /**
     * Получить доступные объекты Store
     * READ-ONLY операция
     */
    getItems(category?: StoreItemCategory): Promise<IStoreItem[]>;

    /**
     * Получить один объект
     * READ-ONLY операция
     */
    getItem(itemId: string): Promise<IStoreItem | null>;

    /**
     * Обменять MC на объект Store
     * ⚠️ GUARD: Не "покупка", а "обмен участия на ценность"
     * 
     * @param userId - Кто обменивает
     * @param itemId - Что получает
     * @param initiatedBy - Кто инициировал (должен быть человек)
     */
    exchange(
        userId: string,
        itemId: string,
        initiatedBy: string
    ): Promise<void>;
}
