import { Controller, Post, Body, HttpException, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ReplayService } from './replay.service';
import { RequireMtls } from '../mtls.decorator';

@Controller('internal/replay')
export class ReplayController {
    constructor(private readonly replayService: ReplayService) { }

    /**
     * Закрытый эндпоинт для разрешения споров (Dispute Resolution).
     * Принимает старый Payload, прогоняет через детерминированный пайплайн 
     * и сверяет результат хеширования с ранее записанным.
     */
    @RequireMtls()
    @Post()
    async replayTransaction(
        @Body('recordedHash') recordedHash: string,
        @Body('payload') payload: any
    ) {
        if (!recordedHash || !payload) {
            throw new HttpException('Missing recordedHash or payload', HttpStatus.BAD_REQUEST);
        }

        const result = await this.replayService.verifyReplay(recordedHash, payload);

        return {
            success: result.isMatch,
            recordedHash,
            replayedHash: result.replayedHash,
            timestamp: Date.now()
        };
    }
}
