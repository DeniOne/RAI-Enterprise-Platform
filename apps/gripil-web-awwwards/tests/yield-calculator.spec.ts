import { expect, test } from "@playwright/test";

test.describe("Yield Calculator Math Invariants", () => {
  test("должен пересчитывать значения по шкале и точному полю без поломки математики", async ({ page }) => {
    test.setTimeout(30_000);

    await page.goto("/");

    const calcSection = page.locator("#calc-section");
    await calcSection.scrollIntoViewIfNeeded();

    await expect(calcSection.getByText("Панель окупаемости")).toBeVisible();
    await expect(calcSection.getByText("31.8 МЛН")).toBeVisible();
    await expect(calcSection.getByText("+1512%")).toBeVisible();

    await calcSection.getByTestId("yield-range").focus();
    for (let step = 0; step < 9; step += 1) {
      await page.keyboard.press("ArrowRight");
    }
    await calcSection.getByTestId("price-input").fill("60000");
    await calcSection.getByTestId("price-input").press("Enter");

    await expect(calcSection.getByText("48.3 МЛН")).toBeVisible();
    await expect(calcSection.getByText("+2300%")).toBeVisible();
    await expect(calcSection.getByText("34.5К")).toBeVisible();
  });
});
