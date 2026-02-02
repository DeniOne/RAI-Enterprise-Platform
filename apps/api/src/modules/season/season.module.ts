import { Module } from '@nestjs/common';
import { SeasonService } from './season.service';
import { SeasonResolver } from './season.resolver';
import { SeasonBusinessRulesService } from './services/season-business-rules.service';
import { SeasonSnapshotService } from './services/season-snapshot.service';
import { AgroAuditModule } from '../agro-audit/agro-audit.module';

@Module({
    imports: [AgroAuditModule],
    providers: [
        SeasonService,
        SeasonResolver,
        SeasonBusinessRulesService,
        SeasonSnapshotService
    ],
    exports: [SeasonService, SeasonBusinessRulesService, SeasonSnapshotService],
})
export class SeasonModule { }
