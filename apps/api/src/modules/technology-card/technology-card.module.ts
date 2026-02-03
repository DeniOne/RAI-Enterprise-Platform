import { Module } from '@nestjs/common';
import { TechnologyCardService } from './technology-card.service';
import { TechnologyCardResolver } from './technology-card.resolver';

@Module({
    providers: [TechnologyCardService, TechnologyCardResolver],
    exports: [TechnologyCardService],
})
export class TechnologyCardModule { }
