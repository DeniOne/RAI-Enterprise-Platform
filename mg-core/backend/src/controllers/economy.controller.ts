import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { TransactionService } from '../services/transaction.service';

const walletService = new WalletService();
const transactionService = new TransactionService();

export class EconomyController {
    async getWallet(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const wallet = await walletService.getWalletByUserId(userId);
            res.json(wallet);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async transfer(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const transaction = await transactionService.createTransaction(req.body, userId);
            res.status(201).json(transaction);
        } catch (error: any) {
            if (error.message === 'Insufficient funds') {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === 'Sender wallet not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getTransactions(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const transactions = await transactionService.getTransactions(userId);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
