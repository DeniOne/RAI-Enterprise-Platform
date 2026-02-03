import { Module } from '@nestjs/common';
import { RapeseedService } from './rapeseed.service';
import { RapeseedResolver } from './rapeseed.resolver';

@Module({
    providers: [RapeseedService, RapeseedResolver],
    exports: [RapeseedService],
})
export class RapeseedModule { }
