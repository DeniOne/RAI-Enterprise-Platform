import { test, expect } from '@playwright/test';

test.describe('Yield Calculator Math Invariants', () => {
  test('Should strictly calculate defaults correctly without animations breaking it', async ({ page }) => {
    // Устанавливаем большой таймаут на загрузку 3D сцен и страницы
    test.setTimeout(30000);

    await page.goto('/');

    const calcSection = page.locator('#calc-section');
    await calcSection.scrollIntoViewIfNeeded();

    // Убедимся, что рендер калькулятора успешен
    await expect(calcSection.getByText('ROI Console')).toBeVisible();

    // Проверяем железобетонную математику дефолтных значений:
    // Площадь: 1000, Урожайность: 25, Цена: 45000
    // Внутренняя логика:
    // Сбор: 2500 т. Потеря (15%): 375 т. Сохранено бабок: 16 875 000.
    // Затраты: 1000 * 1500 = 1 500 000.
    // Чистая выгода: 15 375 000 (формат: 15.4 МЛН)
    // ROI: 1025%
    // С гектара: ~15.4К

    await expect(calcSection.locator('text=15.4 МЛН')).toBeVisible();
    await expect(calcSection.locator('text=+1025%')).toBeVisible();
    await expect(calcSection.locator('text=15.4К')).toBeVisible();
  });
});
