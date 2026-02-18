import { PrismaClient } from '../packages/prisma-client/generated-client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔒 Applying Level D SQL Hardening Triggers...');

    try {
        // 1. FSM Status Transition Guard
        await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION validate_model_status_transition()
      RETURNS TRIGGER AS $$
      BEGIN
          -- If status hasn't changed, allow
          IF (OLD.status = NEW.status) THEN
              RETURN NEW;
          END IF;

          -- Allow transition to ARCHIVED or FAILED from anywhere
          IF (NEW.status IN ('ARCHIVED', 'FAILED')) THEN
              RETURN NEW;
          END IF;

          -- Specific allowed transitions
          IF (OLD.status = 'DRAFT' AND NEW.status = 'SHADOW') THEN
              RETURN NEW;
          ELSIF (OLD.status = 'SHADOW' AND NEW.status = 'CANARY') THEN
              RETURN NEW;
          ELSIF (OLD.status = 'CANARY' AND NEW.status = 'ACTIVE') THEN
              RETURN NEW;
          ELSIF (OLD.status = 'ACTIVE' AND NEW.status = 'ROLLED_BACK') THEN
              RETURN NEW;
          END IF;

          RAISE EXCEPTION 'Invalid model status transition from % to %', OLD.status, NEW.status;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_validate_model_status ON "rai_model_versions";`);
        await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_validate_model_status
      BEFORE UPDATE ON "rai_model_versions"
      FOR EACH ROW EXECUTE FUNCTION validate_model_status_transition();
    `);

        // 2. Lineage Integrity Constraint
        await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION enforce_lineage_integrity()
      RETURNS TRIGGER AS $$
      BEGIN
          -- If parentHash is NULL, it must be the first version (version 1)
          IF (NEW."parentHash" IS NULL) THEN
              IF (NEW.version != 1) THEN
                  RAISE EXCEPTION 'Genesis model (parentHash NULL) must have version 1';
              END IF;
              RETURN NEW;
          END IF;

          -- Check if parentHash exists and belongs to the same model name and company
          IF NOT EXISTS (
              SELECT 1 FROM rai_model_versions 
              WHERE hash = NEW."parentHash" 
              AND name = NEW.name 
              AND "companyId" = NEW."companyId"
          ) THEN
              RAISE EXCEPTION 'Invalid lineage: parentHash % not found for model %', NEW."parentHash", NEW.name;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_enforce_lineage ON "rai_model_versions";`);
        await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_enforce_lineage
      BEFORE INSERT ON "rai_model_versions"
      FOR EACH ROW EXECUTE FUNCTION enforce_lineage_integrity();
    `);

        // 3. Immutability for Core Fields (Tampering Proof)
        await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION prevent_model_tampering()
      RETURNS TRIGGER AS $$
      BEGIN
          IF (OLD.hash != NEW.hash OR OLD."parentHash" IS DISTINCT FROM NEW."parentHash" OR OLD.signature != NEW.signature) THEN
              RAISE EXCEPTION 'Tampering detected: hash, parentHash, and signature are immutable.';
          END IF;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_prevent_model_tampering ON "rai_model_versions";`);
        await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_prevent_model_tampering
      BEFORE UPDATE ON "rai_model_versions"
      FOR EACH ROW EXECUTE FUNCTION prevent_model_tampering();
    `);

        // 4. Drift Report Immutability
        await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION prevent_drift_report_change()
      RETURNS TRIGGER AS $$
      BEGIN
          RAISE EXCEPTION 'Drift reports are immutable.';
      END;
      $$ LANGUAGE plpgsql;
    `);

        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trigger_prevent_drift_report_change ON "rai_drift_reports";`);
        await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_prevent_drift_report_change
      BEFORE UPDATE OR DELETE ON "rai_drift_reports"
      FOR EACH ROW EXECUTE FUNCTION prevent_drift_report_change();
    `);

        console.log('✅ Level D SQL Hardening Triggers applied successfully.');

    } catch (error) {
        console.error('❌ Failed to apply triggers:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
