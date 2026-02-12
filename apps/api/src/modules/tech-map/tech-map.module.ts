import { Module } from '@nestjs/common';
import { TechMapService } from './tech-map.service';
import { TechMapController } from './tech-map.controller';
import { IntegrityModule } from '../integrity/integrity.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';

import { TechMapStateMachine } from './fsm/tech-map.fsm';

@Module({
  imports: [PrismaModule, IntegrityModule],
  controllers: [TechMapController],
  providers: [TechMapService, TechMapStateMachine],
  exports: [TechMapService],
})
export class TechMapModule { }
