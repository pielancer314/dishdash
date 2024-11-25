const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const walletService = require('../services/walletService');
const withdrawalService = require('../services/withdrawalService');
const transactionService = require('../services/transactionService');

// Get wallet balance (both Pi and PCM)
router.get('/balance', auth, async (req, res) => {
    try {
        const piBalance = await walletService.getBalance(req.user.walletAddress);
        const pcmBalance = await walletService.getPCMBalance(req.user.walletAddress);
        
        res.json({
            success: true,
            balance: {
                pi: piBalance,
                pcm: pcmBalance
            }
        });
    } catch (error) {
        console.error('Error fetching balances:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet balances'
        });
    }
});

// Withdraw Pi coins
router.post('/withdraw/pi', auth, async (req, res) => {
    try {
        const { amount, destinationAddress } = req.body;
        const currentBalance = await walletService.getBalance(req.user.walletAddress);

        // Validate withdrawal request
        await withdrawalService.validateWithdrawal(
            req.user._id,
            amount,
            'PI',
            currentBalance
        );

        // Process withdrawal
        const result = await withdrawalService.withdrawPi(
            req.user._id,
            amount,
            destinationAddress
        );

        res.json({
            success: true,
            transaction: result
        });
    } catch (error) {
        console.error('Error withdrawing Pi:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process Pi withdrawal'
        });
    }
});

// Withdraw PCM tokens
router.post('/withdraw/pcm', auth, async (req, res) => {
    try {
        const { amount, destinationAddress } = req.body;
        const currentBalance = await walletService.getPCMBalance(req.user.walletAddress);

        // Validate withdrawal request
        await withdrawalService.validateWithdrawal(
            req.user._id,
            amount,
            'PCM',
            currentBalance
        );

        // Process withdrawal
        const result = await withdrawalService.withdrawPcm(
            req.user._id,
            amount,
            destinationAddress
        );

        res.json({
            success: true,
            transaction: result
        });
    } catch (error) {
        console.error('Error withdrawing PCM:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process PCM withdrawal'
        });
    }
});

// Get withdrawal fees
router.get('/withdraw/fees/:currency', auth, async (req, res) => {
    try {
        const { currency } = req.params;
        const fees = await withdrawalService.getWithdrawalFees(currency);
        
        res.json({
            success: true,
            fees
        });
    } catch (error) {
        console.error('Error fetching withdrawal fees:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal fees'
        });
    }
});

// Estimate withdrawal time
router.get('/withdraw/estimate', auth, async (req, res) => {
    try {
        const { amount, currency } = req.query;
        const estimate = await withdrawalService.estimateWithdrawalTime(
            parseFloat(amount),
            currency
        );
        
        res.json({
            success: true,
            estimate
        });
    } catch (error) {
        console.error('Error estimating withdrawal time:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to estimate withdrawal time'
        });
    }
});

// Get transaction history with filtering and pagination
router.get('/transactions', auth, async (req, res) => {
    try {
        const {
            type,
            status,
            startDate,
            endDate,
            limit,
            skip,
            sort
        } = req.query;

        const transactions = await transactionService.getUserTransactions(
            req.user._id,
            {
                type,
                status,
                startDate,
                endDate,
                limit: parseInt(limit),
                skip: parseInt(skip),
                sort: sort ? JSON.parse(sort) : undefined
            }
        );

        res.json({
            success: true,
            ...transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction history'
        });
    }
});

// Get transaction statistics
router.get('/transactions/stats', auth, async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await transactionService.getTransactionStats(
            req.user._id,
            period
        );

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error fetching transaction stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction statistics'
        });
    }
});

// Get single transaction details
router.get('/transactions/:id', auth, async (req, res) => {
    try {
        const transaction = await transactionService.getTransactionDetails(req.params.id);
        
        // Check if transaction belongs to user
        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to transaction'
            });
        }

        res.json({
            success: true,
            transaction
        });
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction details'
        });
    }
});

module.exports = router;
