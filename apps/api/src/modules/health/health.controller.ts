import { Controller, Get } from '@nestjs/common';
import {
    HealthCheckService,
    HttpHealthIndicator,
    HealthCheck,
    PrismaHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private http: HttpHealthIndicator,
        private db: PrismaHealthIndicator,
        private memory: MemoryHealthIndicator, // Heap verification
        private disk: DiskHealthIndicator, // Disk space verification
        private prisma: PrismaService, // Inject Prisma for custom check if needed
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            // Database Check (using Prisma)
            () => this.db.pingCheck('database', this.prisma),

            // Memory Check (Heap usage should not exceed 1000MB)
            () => this.memory.checkHeap('memory_heap', 1000 * 1024 * 1024),

            // Disk Check (Storage usage should not exceed 90%)
            () => this.disk.checkStorage('storage', { thresholdPercent: 0.9, path: '/' }),

            // External Dependency Check (Example: CRM or Satellite)
            // () => this.http.pingCheck('crm_service', 'https://crm.internal.local'),
        ]);
    }
}
