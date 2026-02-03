import { Module } from '@nestjs/common';
import { FieldRegistryService } from './field-registry.service';
import { FieldRegistryController } from './field-registry.controller';

@Module({
    providers: [FieldRegistryService],
    controllers: [FieldRegistryController],
    exports: [FieldRegistryService],
})
export class FieldRegistryModule { }
