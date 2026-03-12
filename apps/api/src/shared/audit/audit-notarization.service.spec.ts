import { AuditNotarizationService } from "./audit-notarization.service";

describe("AuditNotarizationService", () => {
  it("строит hash-chain, пишет WORM receipt и anchor receipt", async () => {
    const prisma = {
      safeExecuteRaw: jest.fn().mockResolvedValue(1),
      auditNotarizationRecord: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({
          chainHash: "prev-chain-hash",
        }),
      },
    };

    const tx = {
      auditLog: {
        create: jest.fn().mockResolvedValue(undefined),
      },
      auditNotarizationRecord: {
        findFirst: jest.fn().mockResolvedValue({
          chainHash: "prev-chain-hash",
        }),
        create: jest.fn().mockResolvedValue(undefined),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([]),
    };

    const service = new AuditNotarizationService(
      prisma as any,
      {
        getActiveKeyReference: jest.fn().mockResolvedValue({
          kid: "audit-kid:v1",
        }),
        signEd25519: jest.fn().mockResolvedValue("signed-chain-hash"),
      } as any,
      {
        uploadImmutableObject: jest.fn().mockResolvedValue({
          provider: "filesystem",
          uri: "file:///tmp/audit.json",
          objectKey: "audit-logs/company-1/object.json",
          contentHash: "worm-content-hash",
          retentionUntil: new Date("2033-03-12T00:00:00.000Z"),
          mirroredUri: null,
        }),
        describeConfig: jest.fn().mockReturnValue("provider=filesystem"),
      } as any,
      {
        anchorHash: jest.fn().mockResolvedValue({
          provider: "PRIMARY_L1_EVM",
          receiptId: "receipt-1",
          rootHash: "root-hash-1",
          anchoredAt: new Date("2026-03-12T20:00:00.000Z"),
          metadata: { domain: "audit_log" },
        }),
      } as any,
    );

    await service.persistAuditedEvent(tx as any, {
      id: "audit-1",
      action: "USER_LOGIN",
      companyId: "company-1",
      userId: "user-1",
      ip: "127.0.0.1",
      userAgent: "jest",
      metadata: {
        _tamperEvident: {
          hash: "audit-hmac",
        },
      },
      createdAt: new Date("2026-03-12T19:59:00.000Z"),
    });

    expect(prisma.safeExecuteRaw).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(tx.auditNotarizationRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        auditLogId: "audit-1",
        companyId: "company-1",
        prevChainHash: "prev-chain-hash",
        wormProvider: "filesystem",
        anchorReceiptId: "receipt-1",
        hsmKid: "audit-kid:v1",
      }),
    });
  });

  it("роняет readiness, если последний WORM object недоступен", async () => {
    const service = new AuditNotarizationService(
      {
        auditNotarizationRecord: {
          findFirst: jest.fn().mockResolvedValue({
            anchoredAt: new Date("2026-03-12T20:00:00.000Z"),
            wormUri: "file:///missing-proof.json",
          }),
        },
      } as any,
      {} as any,
      {
        isReady: jest.fn().mockReturnValue(true),
        isObjectAccessible: jest.fn().mockResolvedValue(false),
        describeConfig: jest
          .fn()
          .mockReturnValue("provider=filesystem,path=/root/RAI_EP/var/audit-worm"),
      } as any,
      {} as any,
    );

    await expect(service.checkReadiness()).rejects.toThrow(
      "Latest audit notarization proof is not accessible in WORM storage",
    );
  });
});
