import { Injectable } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { HsmService } from "../../level-f/crypto/hsm.service";
import { WormStorageService } from "../../level-f/worm/worm-storage.service";
import { AnchorService } from "../../level-f/gateway/anchoring/anchor.service";
import { CanonicalJsonBuilder } from "../crypto/canonical-json.builder";
import { PrismaService } from "../prisma/prisma.service";

type AuditLogSnapshot = {
  id: string;
  action: string;
  companyId: string;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
  createdAt: Date;
};

type AuditTx = {
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
  };
  auditNotarizationRecord: {
    findFirst: (args: unknown) => Promise<any>;
    create: (args: unknown) => Promise<any>;
    findUnique?: (args: unknown) => Promise<any>;
  };
  $queryRaw?: <T = unknown>(query: Prisma.Sql) => Promise<T>;
  $executeRaw: (query: Prisma.Sql) => Promise<unknown>;
};

@Injectable()
export class AuditNotarizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hsmService: HsmService,
    private readonly wormStorageService: WormStorageService,
    private readonly anchorService: AnchorService,
  ) {}

  async persistAuditedEvent(
    tx: AuditTx,
    snapshot: AuditLogSnapshot,
  ): Promise<void> {
    await this.acquireCompanyChainLock(snapshot.companyId, tx);

    const previousRecord = await tx.auditNotarizationRecord.findFirst({
      where: { companyId: snapshot.companyId },
      orderBy: [{ anchoredAt: "desc" }, { createdAt: "desc" }],
      select: { chainHash: true },
    });

    const entryHash = CanonicalJsonBuilder.hash({
      id: snapshot.id,
      action: snapshot.action,
      companyId: snapshot.companyId,
      userId: snapshot.userId ?? null,
      ip: snapshot.ip ?? null,
      userAgent: snapshot.userAgent ?? null,
      metadata: snapshot.metadata ?? null,
      createdAt: snapshot.createdAt.toISOString(),
    });

    const prevChainHash = previousRecord?.chainHash ?? null;
    const chainHash = CanonicalJsonBuilder.hash({
      entryHash,
      prevChainHash,
      companyId: snapshot.companyId,
      auditLogId: snapshot.id,
      createdAt: snapshot.createdAt.toISOString(),
    });

    const keyReference = await this.hsmService.getActiveKeyReference();
    const hsmSignature = await this.hsmService.signEd25519(chainHash, keyReference);
    const anchorReceipt = await this.anchorService.anchorHash(chainHash, {
      domain: "audit_log",
      companyId: snapshot.companyId,
      objectId: snapshot.id,
    });
    const wormReceipt = await this.wormStorageService.uploadImmutableObject(
      this.buildObjectKey(snapshot, chainHash),
      {
        schemaVersion: "audit_notarization_v1",
        auditLog: {
          id: snapshot.id,
          action: snapshot.action,
          companyId: snapshot.companyId,
          userId: snapshot.userId ?? null,
          ip: snapshot.ip ?? null,
          userAgent: snapshot.userAgent ?? null,
          metadata: snapshot.metadata ?? null,
          createdAt: snapshot.createdAt.toISOString(),
        },
        proof: {
          entryHash,
          prevChainHash,
          chainHash,
          hsmKid: keyReference.kid,
          hsmSignature,
          anchorProvider: anchorReceipt.provider,
          anchorReceiptId: anchorReceipt.receiptId,
          anchoredAt: anchorReceipt.anchoredAt.toISOString(),
          rootHash: anchorReceipt.rootHash,
          metadata: anchorReceipt.metadata ?? null,
        },
      },
    );

    await tx.auditLog.create({
      data: {
        id: snapshot.id,
        action: snapshot.action,
        companyId: snapshot.companyId,
        userId: snapshot.userId ?? undefined,
        ip: snapshot.ip ?? undefined,
        userAgent: snapshot.userAgent ?? undefined,
        metadata: snapshot.metadata as Prisma.InputJsonValue,
        createdAt: snapshot.createdAt,
      },
    });

    await tx.auditNotarizationRecord.create({
      data: {
        auditLogId: snapshot.id,
        companyId: snapshot.companyId,
        entryHash,
        prevChainHash: prevChainHash ?? undefined,
        chainHash,
        wormProvider: wormReceipt.provider,
        wormObjectKey: wormReceipt.objectKey,
        wormUri: wormReceipt.uri,
        wormContentHash: wormReceipt.contentHash,
        retentionMode: "COMPLIANCE",
        retentionUntil: wormReceipt.retentionUntil,
        hsmKid: keyReference.kid,
        hsmSignature,
        anchorProvider: anchorReceipt.provider,
        anchorReceiptId: anchorReceipt.receiptId,
        anchoredAt: anchorReceipt.anchoredAt,
        metadata: {
          mirroredUri: wormReceipt.mirroredUri ?? null,
          anchorMetadata: anchorReceipt.metadata ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async findProofByAuditLogId(auditLogId: string) {
    return this.prisma.auditNotarizationRecord.findUnique({
      where: { auditLogId },
    });
  }

  async checkReadiness(): Promise<{
    status: "up";
    provider: string;
    latestAnchoredAt: string | null;
    storage: ReturnType<WormStorageService["getReadinessDetails"]>;
  }> {
    if (!this.wormStorageService.isReady()) {
      throw new Error("WORM storage is not ready");
    }

    const latest = await this.prisma.auditNotarizationRecord.findFirst({
      orderBy: [{ anchoredAt: "desc" }, { createdAt: "desc" }],
      select: { anchoredAt: true, wormUri: true },
    });

    if (
      latest?.wormUri &&
      !(await this.wormStorageService.isObjectAccessible(latest.wormUri))
    ) {
      throw new Error(
        "Latest audit notarization proof is not accessible in WORM storage",
      );
    }

    return {
      status: "up",
      provider: this.wormStorageService.describeConfig(),
      latestAnchoredAt: latest?.anchoredAt?.toISOString() ?? null,
      storage: this.wormStorageService.getReadinessDetails(),
    };
  }

  private async acquireCompanyChainLock(
    companyId: string,
    tx: AuditTx,
  ): Promise<void> {
    await this.prisma.safeExecuteRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`audit-notary:${companyId}`})::bigint)`,
      tx,
    );
  }

  private buildObjectKey(snapshot: AuditLogSnapshot, chainHash: string): string {
    const day = snapshot.createdAt.toISOString().slice(0, 10);
    return [
      "audit-logs",
      snapshot.companyId,
      day,
      `${snapshot.createdAt.toISOString()}_${snapshot.id}_${chainHash.slice(0, 16)}.json`,
    ].join("/");
  }
}
