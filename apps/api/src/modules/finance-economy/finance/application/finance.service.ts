import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
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

        return this.prisma.cashAccount.update({
            where: { id: accountId },
            data: {
                balance: { increment: amount },
            },
        });
    }
}
