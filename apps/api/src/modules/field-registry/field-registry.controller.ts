import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FieldRegistryService } from './field-registry.service';
import { CreateFieldDto } from './dto/create-field.dto';

@Controller('registry/fields')
export class FieldRegistryController {
    constructor(private readonly fieldRegistryService: FieldRegistryService) { }

    @Post()
    async create(@Body() createFieldDto: CreateFieldDto) {
        // TODO: BLOCK-AUTH (companyId should be extracted from Request/JWT)
        return this.fieldRegistryService.create(createFieldDto, createFieldDto.companyId);
    }

    @Get()
    async findAll(@Query('companyId') companyId: string) {
        // TODO: BLOCK-AUTH (companyId should be extracted from Request/JWT)
        return this.fieldRegistryService.findAll(companyId);
    }
}
