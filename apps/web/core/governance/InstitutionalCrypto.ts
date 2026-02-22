/**
 * @file InstitutionalCrypto.ts
 * @description Криптографический слой для обеспечения детерминизма и неизменности.
 * Реализует RFC8785 (Canonical JSON) и SHA-256 хеширование.
 */

/**
 * Каноническая сериализация объекта согласно RFC8785.
 * 1. Лексикографическая сортировка ключей.
 * 2. Отсутствие лишних пробелов.
 * 3. Детерминированное представление базовых типов.
 */
export function canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
        // Числа, строки, булевы значения и null сериализуются стандартно
        return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalize).join(',') + ']';
    }

    // Сортировка ключей для обеспечения детерминизма (Invariant-4.3)
    // ВАЖНО: Исключаем transient-поля (immutableHash), которые не должны влиять на хеш до фиксации
    const keys = Object.keys(obj)
        .filter(key => key !== 'immutableHash')
        .sort();

    const result = keys.map(key => {
        const value = obj[key];
        // Пропускаем undefined значения согласно JSON канонам
        if (value === undefined) return null;
        return `${JSON.stringify(key)}:${canonicalize(value)}`;
    }).filter(Boolean);

    return `{${result.join(',')}}`;
}

/**
 * Вычисляет SHA-256 хеш от канонического представления данных.
 * @param data Любой объект для хеширования.
 * @returns HEX-строка хеша.
 */
export async function computeHash(data: any): Promise<string> {
    const canonical = canonicalize(data);
    const msgUint8 = new TextEncoder().encode(canonical);

    // Используем Web Crypto API для поддержки как браузера, так и серверных сред Next.js
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
