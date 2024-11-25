const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const transactionService = require('../services/transactionService');
const withdrawalService = require('../services/withdrawalService');

// Admin middleware to check admin role
const isAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Apply rate limiter and admin check to all routes
router.use(apiLimiter);
router.use(auth);
router.use(isAdmin);

// Get system overview
router.get('/overview', async (req, res) => {
    try {
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        // Get various statistics
        const [
            dailyTransactions,
            weeklyTransactions,
            pendingWithdrawals,
            failedTransactions
        ] = await Promise.all([
            transactionService.getSystemStats(oneDayAgo),
            transactionService.getSystemStats(oneWeekAgo),
            transactionService.getPendingWithdrawals(),
            transactionService.getFailedTransactions()
        ]);

        res.json({
            success: true,
            overview: {
                daily: dailyTransactions,
                weekly: weeklyTransactions,
                pending: pendingWithdrawals,
                failed: failedTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching system overview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system overview'
        });
    }
});

// Get all transactions with advanced filtering
router.get('/transactions', async (req, res) => {
    try {
        const {
            type,
            status,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            userId,
            limit = 50,
            skip = 0,
            sort
        } = req.query;

        const transactions = await transactionService.getAllTransactions({
            type,
            status,
            startDate,
            endDate,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
            userId,
            limit: parseInt(limit),
            skip: parseInt(skip),
            sort: sort ? JSON.parse(sort) : undefined
        });

        res.json({
            success: true,
            ...transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions'
        });
    }
});

// Get user transaction history
router.get('/users/:userId/transactions', async (req, res) => {
    try {
        const { userId } = req.params;
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
            userId,
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
        console.error('Error fetching user transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user transactions'
        });
    }
});

// Review and approve/reject pending withdrawals
router.post('/withdrawals/:id/review', async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }

        const result = await withdrawalService.reviewWithdrawal(
            id,
            action,
            reason,
            req.user._id
        );

        res.json({
            success: true,
            withdrawal: result
        });
    } catch (error) {
        console.error('Error reviewing withdrawal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review withdrawal'
        });
    }
});

// Get system alerts and notifications
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await transactionService.getSystemAlerts();
        res.json({
            success: true,
            alerts
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system alerts'
        });
    }
});

// Manual transaction reconciliation
router.post('/transactions/:id/reconcile', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await transactionService.reconcileTransaction(id, req.user._id);
        
        res.json({
            success: true,
            transaction: result
        });
    } catch (error) {
        console.error('Error reconciling transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reconcile transaction'
        });
    }
});

// Get system health metrics
router.get('/health', async (req, res) => {
    try {
        const metrics = await transactionService.getSystemHealth();
        res.json({
            success: true,
            metrics
        });
    } catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system health metrics'
        });
    }
});

module.exports = router;
