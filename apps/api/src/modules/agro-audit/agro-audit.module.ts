import { Module, Global } from '@nestjs/common';
import { AgroAuditService } from './agro-audit.service';
import { AuditModule } from '../../shared/audit/audit.module';

@Global()
@Module({
    imports: [AuditModule],
    providers: [AgroAuditService],
    exports: [AgroAuditService],
})
export class AgroAuditModule { }
