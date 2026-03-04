import {
  EvidenceCreateDtoSchema,
  EvidenceResponseDtoSchema,
} from "./evidence.dto";

describe("Evidence DTO", () => {
  it("принимает валидный payload", () => {
    const result = EvidenceCreateDtoSchema.parse({
      operationId: "op-1",
      evidenceType: "PHOTO",
      fileUrl: "https://example.com/evidence.jpg",
      capturedAt: "2026-03-03T10:00:00.000Z",
      checksum:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      companyId: "company-1",
    });

    expect(result.capturedAt).toBeInstanceOf(Date);
  });

  it("отклоняет невалидный checksum", () => {
    expect(() =>
      EvidenceResponseDtoSchema.parse({
        id: "ev-1",
        operationId: "op-1",
        evidenceType: "PHOTO",
        fileUrl: "https://example.com/evidence.jpg",
        capturedAt: "2026-03-03T10:00:00.000Z",
        checksum: "broken",
        companyId: "company-1",
        createdAt: "2026-03-03T10:05:00.000Z",
      }),
    ).toThrow();
  });
});
