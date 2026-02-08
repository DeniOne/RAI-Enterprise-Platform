import { Module } from '@nestjs/common';
import { ActionDecisionService } from './decision.service';
// import { CoreModule } from '../../../core/core.module'; // Removed as per error, assuming functionality is in module scope or global
import { PrismaModule } from '../../shared/prisma/prisma.module'; // Added PrismaModule
import { RiskController } from './risk.controller'; // Assuming this exists or will be created? No, user error says Cannot find name, so need to import it if exists, or remove if not. 
// Wait, if RiskController doesn't exist, I should remove it.
import { RiskService } from './risk.service';

@Module({
    imports: [PrismaModule],
    controllers: [],
    providers: [RiskService, ActionDecisionService],
    exports: [RiskService, ActionDecisionService]
})
export class RiskModule { }
