import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class RecognitionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Recognition events are append-only.
     */
    async recordRecognition(data: {
        employeeId: string;
        type: 'PEER' | 'MANAGER' | 'SYSTEM';
        message: string;
    }) {
        return this.prisma.hrRecognitionEvent.create({
            data: {
                employee: { connect: { id: data.employeeId } },
                type: data.type,
                message: data.message,
            },
        });
    }

    async getEmployeeRecognitions(employeeId: string) {
        return this.prisma.hrRecognitionEvent.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
