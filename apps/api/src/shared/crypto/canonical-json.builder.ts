import * as crypto from 'crypto';

/**
 * Библиотека для создания Canonical JSON (RFC 8785)
 * Гарантирует криптографически детерминированную сериализацию объектов,
 * независимую от порядка ключей и пробелов в исходном объекте.
 */
export class CanonicalJsonBuilder {
    /**
     * Сериализует объект в Canonical JSON.
     * Ключи объектов сортируются лексикографически.
     * Пробельные символы вне строк удаляются.
     *
     * @param data Произвольный JSON-совместимый объект
     * @returns Строка на основе стандарта RFC 8785
     */
    public static stringify(data: any): string {
        if (data === null || typeof data !== 'object') {
            return JSON.stringify(data);
        }

        if (Array.isArray(data)) {
            const items = data.map((item) => this.stringify(item));
            return '[' + items.join(',') + ']';
        }

        const keys = Object.keys(data).sort();
        const props = keys.map((key) => {
            // Игнорируем undefined, они не сериализуются в JSON
            if (data[key] === undefined) {
                return '';
            }
            return JSON.stringify(key) + ':' + this.stringify(data[key]);
        }).filter(p => p !== ''); // Удаляем пустые строки от undefined

        return '{' + props.join(',') + '}';
    }

    /**
     * Генерирует Ed25519 SHA-256 хэш (или просто SHA-256) от Canonical JSON
     * @param data Объект для хэширования
     * @returns Hex-строка с хэшем
     */
    public static hash(data: any): string {
        const canonicalString = this.stringify(data);
        return crypto.createHash('sha256').update(canonicalString).digest('hex');
    }

    /**
     * Проверяет, совпадает ли хэш объекта с ожидаемым
     */
    public static verifyHash(data: any, expectedHash: string): boolean {
        return this.hash(data) === expectedHash;
    }
}
