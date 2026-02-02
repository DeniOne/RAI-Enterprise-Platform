import { Module, Global } from '@nestjs/common';
import { ContextService } from '../cache/context.service.js';
import { MemoryManager } from './memory-manager.service.js';

@Global()
@Module({
    providers: [ContextService, MemoryManager],
    exports: [ContextService, MemoryManager],
})
export class MemoryModule { }
