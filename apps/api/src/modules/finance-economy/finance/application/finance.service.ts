import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';

@Injectable()
export class FinanceService {
    private readonly logger = new Logger(FinanceService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Управление счетами (CashAccount).
     */
    async getCashAccounts(companyId: string) {
        return this.prisma.cashAccount.findMany({
            where: { companyId },
        });
    }

    async createCashAccount(companyId: string, name: string, currency = 'RUB') {
        return this.prisma.cashAccount.create({
            data: {
                companyId,
                name,
                currency,
                balance: 0,
            },
        });
    }

    async updateBalance(accountId: string, amount: number, companyId: string) {
        const account = await this.prisma.cashAccount.findFirst({
            where: { id: accountId, companyId },
        });

        if (!account) {
            throw new NotFoundException(`Cash account ${accountId} not found`);
        }

        const updated = await this.prisma.cashAccount.updateMany({
            where: { id: accountId, companyId, version: account.version },
            data: {
                balance: { increment: amount },
                version: { increment: 1 },
            },
        });
        if (updated.count !== 1) {
            throw new ConflictException(`Cash account ${accountId} version conflict`);
        }
        return this.prisma.cashAccount.findFirstOrThrow({
            where: { id: accountId, companyId },
        });
    }
}
