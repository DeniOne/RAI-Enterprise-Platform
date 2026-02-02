import { Module } from '@nestjs/common';
import { RapeseedService } from './Rapeseed.service';
import { RapeseedResolver } from './Rapeseed.resolver';

@Module({
    providers: [RapeseedService, RapeseedResolver],
    exports: [RapeseedService],
})
export class RapeseedModule { }
