import { Test, TestingModule } from "@nestjs/testing";
import { RationaleGenerator } from "./rationale-generator";

describe("RationaleGenerator", () => {
  let generator: RationaleGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RationaleGenerator],
    }).compile();

    generator = module.get<RationaleGenerator>(RationaleGenerator);
  });

  it("должен генерировать текст для критических факторов", () => {
    const factors: any[] = [
      { type: "C", description: "Critical issue", impact: "HIGH" },
    ];

    const text = generator.generateRationale(factors);

    expect(text).toContain("Критические факторы");
    expect(text).toContain("Critical issue");
  });

  it("должен возвращать дефолтное сообщение если факторов нет", () => {
    const text = generator.generateRationale([]);
    expect(text).toContain("Специфических факторов влияния не обнаружено");
  });
});
