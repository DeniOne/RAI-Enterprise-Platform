import { Test, TestingModule } from "@nestjs/testing";
import { SensitiveDataFilterService } from "./sensitive-data-filter.service";

describe("SensitiveDataFilterService", () => {
  let service: SensitiveDataFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SensitiveDataFilterService],
    }).compile();
    service = module.get(SensitiveDataFilterService);
  });

  it("маскирует ИНН 10 цифр", () => {
    expect(service.mask("ИНН 1234567890")).toContain("[ИНН СКРЫТ]");
    expect(service.mask("ИНН 1234567890")).not.toContain("1234567890");
  });

  it("маскирует ИНН 12 цифр", () => {
    expect(service.mask("ИНН юрлица 123456789012")).toContain("[ИНН СКРЫТ]");
  });

  it("маскирует расчётный счёт", () => {
    expect(service.mask("Счет 40702810900000001234")).toContain("Счет ***");
    expect(service.mask("40702810900000001234")).toContain("***");
  });

  it("маскирует email", () => {
    expect(service.mask("Пишите test@mail.ru")).toContain("[HIDDEN_EMAIL]");
    expect(service.mask("test@mail.ru")).not.toContain("test@mail.ru");
  });

  it("маскирует телефон РФ", () => {
    expect(service.mask("Звоните +79001234567")).toContain("[ТЕЛЕФОН СКРЫТ]");
    expect(service.mask("89001234567")).toContain("[ТЕЛЕФОН СКРЫТ]");
  });

  it("комбинированный пример из DoD", () => {
    const input = "Счет 40702810900000001234, email test@mail.ru";
    const out = service.mask(input);
    expect(out).toContain("***");
    expect(out).toContain("[HIDDEN_EMAIL]");
    expect(out).not.toContain("40702810900000001234");
    expect(out).not.toContain("test@mail.ru");
  });

  it("не портит обычный текст", () => {
    const input = "Норма высева 4.5 кг/га, поле №7.";
    expect(service.mask(input)).toBe(input);
  });

  it("пустая строка и не строка возвращает как есть", () => {
    expect(service.mask("")).toBe("");
    expect(service.mask(null as unknown as string)).toBe(null);
  });
});
