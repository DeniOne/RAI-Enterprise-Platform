import { expect, test } from "@playwright/test";

test.describe("Release Hardening", () => {
  test("не должен блокировать первый экран", async ({ page }) => {
    const homeResponse = await page.goto("/");

    expect(homeResponse?.ok()).toBeTruthy();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await expect(page.getByRole("button", { name: "Рассчитать выгоду" })).toBeVisible();
  });

  test("форма должна требовать consent и честно показывать ошибку при отказе сервиса", async ({ page }) => {
    await page.route("**/api/lead", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "Приём заявок временно недоступен. Используйте страницу контактов.",
        }),
      });
    });

    await page.goto("/");

    const ctaSection = page.locator("#cta-section");
    await ctaSection.scrollIntoViewIfNeeded();

    const phoneInput = ctaSection.getByPlaceholder("+7 (___) ___-__-__");
    await phoneInput.fill("+7 (999) 111-22-33");

    await ctaSection.getByRole("button", { name: /Отправить/i }).click();
    await expect(ctaSection.getByText(/Подтвердите согласие/i)).toBeVisible();

    await ctaSection.getByRole("checkbox").check();
    await ctaSection.getByRole("button", { name: /Отправить/i }).click();
    await expect(ctaSection.getByText(/Используйте страницу контактов/i)).toBeVisible();
    await expect(ctaSection.getByText(/Форма отправляет заявку только при реальной доставке/i)).not.toBeVisible();
  });

  test("не должен отправлять форму повторно во время pending-состояния", async ({ page }) => {
    let releaseResponse!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    let submitCount = 0;

    await page.route("**/api/lead", async (route) => {
      submitCount += 1;
      await responseGate;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "Приём заявок временно недоступен. Попробуйте ещё раз позже или используйте страницу контактов.",
        }),
      });
    });

    await page.goto("/");

    const ctaSection = page.locator("#cta-section");
    await ctaSection.scrollIntoViewIfNeeded();

    await ctaSection.getByPlaceholder("+7 (___) ___-__-__").fill("+7 (999) 111-22-33");
    await ctaSection.getByRole("checkbox").check();

    const submitButton = ctaSection.locator('button[type="submit"]');
    await submitButton.click();
    await expect(submitButton).toBeDisabled({ timeout: 2_000 });
    await submitButton.evaluate((button) => {
      (button as HTMLButtonElement).click();
    });

    expect(submitCount).toBe(1);
    releaseResponse();
    await expect(ctaSection.getByText(/Приём заявок временно недоступен/i)).toBeVisible();
  });

  test("FAQ должен открываться с клавиатуры", async ({ page }) => {
    await page.goto("/");

    const faqButton = page.getByRole("button", {
      name: "Можно ли применять ГРИПИЛ вместе с десикантами?",
    });

    await faqButton.scrollIntoViewIfNeeded();
    await faqButton.focus();
    await expect(faqButton).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Enter");
    await expect(faqButton).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Space");
    await expect(faqButton).toHaveAttribute("aria-expanded", "true");
  });
});
