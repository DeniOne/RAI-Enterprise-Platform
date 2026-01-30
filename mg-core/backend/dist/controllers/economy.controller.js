"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomyController = void 0;
const wallet_service_1 = require("../services/wallet.service");
const transaction_service_1 = require("../services/transaction.service");
const walletService = new wallet_service_1.WalletService();
const transactionService = new transaction_service_1.TransactionService();
class EconomyController {
    async getWallet(req, res) {
        try {
            const userId = req.user.id;
            const wallet = await walletService.getWalletByUserId(userId);
            res.json(wallet);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async transfer(req, res) {
        try {
            const userId = req.user.id;
            const transaction = await transactionService.createTransaction(req.body, userId);
            res.status(201).json(transaction);
        }
        catch (error) {
            if (error.message === 'Insufficient funds') {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === 'Sender wallet not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getTransactions(req, res) {
        try {
            const userId = req.user.id;
            const transactions = await transactionService.getTransactions(userId);
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.EconomyController = EconomyController;
