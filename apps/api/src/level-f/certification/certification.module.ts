import { Module } from "@nestjs/common";
import { AssertionFencesService } from "./assertion-fences.service";
import { RatingEngineService } from "./rating-engine.service";
import { JwtMinterService } from "./jwt-minter.service";
import { ReproducibilityCheckerService } from "./reproducibility-checker.service";
import { SnapshotModule } from "../snapshot/snapshot.module";
import { CertAuditModule } from "../../shared/audit/cert-audit/cert-audit.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    SnapshotModule,
    CertAuditModule,
    // В реальности здесь должны быть подгружены Ed25519 ключи из Vault
    JwtModule.register({
      secret: "stub_secret_for_tests",
      signOptions: { expiresIn: "365d" },
    }),
  ],
  providers: [
    AssertionFencesService,
    RatingEngineService,
    JwtMinterService,
    ReproducibilityCheckerService,
  ],
  exports: [
    RatingEngineService,
    JwtMinterService,
    ReproducibilityCheckerService,
  ],
})
export class CertificationModule {}
