import { Module } from '@nestjs/common';
import { ClientRegistryService } from './client-registry.service';
import { ClientRegistryController } from './client-registry.controller';

@Module({
    providers: [ClientRegistryService],
    controllers: [ClientRegistryController],
    exports: [ClientRegistryService],
})
export class ClientRegistryModule { }
