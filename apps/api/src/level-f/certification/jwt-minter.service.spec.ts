import { JwtMinterService } from "./jwt-minter.service";
import { HsmService } from "../crypto/hsm.service";
import { CertAuditService } from "../../shared/audit/cert-audit/cert-audit.service";

describe("JwtMinterService", () => {
  const rating = {
    grade: "AAA",
    score: 97.4,
  };

  const snapshot = {
    companyId: "company-1",
    schemaVersion: "v1",
  };

  it("пишет audit intent/completed и включает kid в JWT header", async () => {
    const hsmService = {
      getActiveKeyReference: jest.fn().mockResolvedValue({
        keyName: "institutional-jwt-mstr",
        keyVersion: 3,
        kid: "institutional-jwt-mstr:v3",
      }),
      signEd25519: jest.fn().mockResolvedValue("signed-segment"),
    } as unknown as HsmService;

    const certAuditService = {
      logSignatureIntent: jest.fn().mockResolvedValue(undefined),
      logSignatureCompleted: jest.fn().mockResolvedValue(undefined),
      logSignatureError: jest.fn().mockResolvedValue(undefined),
    } as unknown as CertAuditService;

    const service = new JwtMinterService(hsmService, certAuditService);
    const token = await service.mintCertificate(
      rating as any,
      snapshot as any,
      "snapshot-hash-1",
    );

    const [encodedHeader] = token.split(".");
    const header = JSON.parse(
      Buffer.from(encodedHeader, "base64url").toString("utf8"),
    );

    expect(header).toEqual(
      expect.objectContaining({
        alg: "EdDSA",
        typ: "JWT",
        kid: "institutional-jwt-mstr:v3",
      }),
    );
    expect((certAuditService as any).logSignatureIntent).toHaveBeenCalledWith({
      companyId: "company-1",
      initiatorProcess: "JwtMinterService",
      snapshotHash: "snapshot-hash-1",
      kidUsed: "institutional-jwt-mstr:v3",
    });
    expect((certAuditService as any).logSignatureCompleted).toHaveBeenCalledWith({
      companyId: "company-1",
      initiatorProcess: "JwtMinterService",
      snapshotHash: "snapshot-hash-1",
      kidUsed: "institutional-jwt-mstr:v3",
    });
    expect((certAuditService as any).logSignatureError).not.toHaveBeenCalled();
  });

  it("пишет audit error при сбое HSM подписи", async () => {
    const hsmService = {
      getActiveKeyReference: jest.fn().mockResolvedValue({
        keyName: "institutional-jwt-mstr",
        keyVersion: 5,
        kid: "institutional-jwt-mstr:v5",
      }),
      signEd25519: jest.fn().mockRejectedValue(new Error("Vault offline")),
    } as unknown as HsmService;

    const certAuditService = {
      logSignatureIntent: jest.fn().mockResolvedValue(undefined),
      logSignatureCompleted: jest.fn().mockResolvedValue(undefined),
      logSignatureError: jest.fn().mockResolvedValue(undefined),
    } as unknown as CertAuditService;

    const service = new JwtMinterService(hsmService, certAuditService);

    await expect(
      service.mintCertificate(rating as any, snapshot as any, "snapshot-hash-2"),
    ).rejects.toThrow("Vault offline");

    expect((certAuditService as any).logSignatureIntent).toHaveBeenCalledTimes(1);
    expect((certAuditService as any).logSignatureCompleted).not.toHaveBeenCalled();
    expect((certAuditService as any).logSignatureError).toHaveBeenCalledWith({
      companyId: "company-1",
      initiatorProcess: "JwtMinterService",
      snapshotHash: "snapshot-hash-2",
      kidUsed: "institutional-jwt-mstr:v5",
      errorReason: "Vault offline",
    });
  });
});
