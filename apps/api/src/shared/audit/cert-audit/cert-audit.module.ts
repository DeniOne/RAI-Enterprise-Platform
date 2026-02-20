import { Module } from '@nestjs/common';
import { CertAuditService } from './cert-audit.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [CertAuditService],
    exports: [CertAuditService],
})
export class CertAuditModule { }
