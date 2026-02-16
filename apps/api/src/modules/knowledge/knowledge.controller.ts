import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
    constructor(private readonly knowledgeService: KnowledgeService) { }

    @Get('graph')
    async getGraph() {
        try {
            return await this.knowledgeService.getGraphSnapshot();
        } catch (error) {
            throw new HttpException(
                'Failed to load knowledge graph snapshot',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
