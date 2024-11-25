const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { redis } = require('../middleware/rateLimiter');

class AdminService {
    // Get system-wide transaction statistics
    async getSystemStats(startDate) {
        try {
            const stats = await Transaction.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        avgAmount: { $avg: '$amount' },
                        successCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
                        },
                        failureCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
                        },
                        totalFees: { $sum: '$fee' }
                    }
                }
            ]);

            return stats;
        } catch (error) {
            console.error('Error getting system stats:', error);
            throw new Error('Failed to get system statistics');
        }
    }

    // Get all pending withdrawals
    async getPendingWithdrawals() {
        try {
            const withdrawals = await Transaction.find({
                type: { $in: ['PI_WITHDRAWAL', 'PCM_WITHDRAWAL'] },
                status: 'PENDING'
            })
            .populate('userId', 'email username')
            .sort({ timestamp: -1 })
            .exec();

            return withdrawals;
        } catch (error) {
            console.error('Error getting pending withdrawals:', error);
            throw new Error('Failed to get pending withdrawals');
        }
    }

    // Get failed transactions
    async getFailedTransactions(options = {}) {
        try {
            const {
                startDate,
                endDate,
                limit = 50,
                skip = 0
            } = options;

            const query = { status: 'FAILED' };

            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }

            const transactions = await Transaction.find(query)
                .populate('userId', 'email username')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec();

            const total = await Transaction.countDocuments(query);

            return {
                transactions,
                total,
                hasMore: total > skip + limit
            };
        } catch (error) {
            console.error('Error getting failed transactions:', error);
            throw new Error('Failed to get failed transactions');
        }
    }

    // Get all transactions with advanced filtering
    async getAllTransactions(options = {}) {
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
                sort = { timestamp: -1 }
            } = options;

            const query = {};

            if (type) query.type = type;
            if (status) query.status = status;
            if (userId) query.userId = mongoose.Types.ObjectId(userId);
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }
            if (minAmount || maxAmount) {
                query.amount = {};
                if (minAmount) query.amount.$gte = minAmount;
                if (maxAmount) query.amount.$lte = maxAmount;
            }

            const transactions = await Transaction.find(query)
                .populate('userId', 'email username')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec();

            const total = await Transaction.countDocuments(query);

            return {
                transactions,
                total,
                hasMore: total > skip + limit
            };
        } catch (error) {
            console.error('Error getting all transactions:', error);
            throw new Error('Failed to get transactions');
        }
    }

    // Get system alerts
    async getSystemAlerts() {
        try {
            const alerts = [];

            // Check for high failure rate
            const recentTransactions = await Transaction.find({
                timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
            });

            const failedCount = recentTransactions.filter(tx => tx.status === 'FAILED').length;
            const failureRate = failedCount / recentTransactions.length;

            if (failureRate > 0.1) { // More than 10% failure rate
                alerts.push({
                    type: 'HIGH_FAILURE_RATE',
                    severity: 'HIGH',
                    message: `High transaction failure rate: ${(failureRate * 100).toFixed(2)}%`,
                    timestamp: new Date()
                });
            }

            // Check for large pending withdrawals
            const largeWithdrawals = await Transaction.find({
                type: { $in: ['PI_WITHDRAWAL', 'PCM_WITHDRAWAL'] },
                status: 'PENDING',
                amount: { $gt: 1000 } // Threshold for "large" withdrawal
            });

            if (largeWithdrawals.length > 0) {
                alerts.push({
                    type: 'LARGE_PENDING_WITHDRAWALS',
                    severity: 'MEDIUM',
                    message: `${largeWithdrawals.length} large withdrawals pending review`,
                    timestamp: new Date()
                });
            }

            // Check rate limit violations
            const rateLimitKeys = await redis.keys('rl:*');
            const blockedIPs = [];

            for (const key of rateLimitKeys) {
                const count = await redis.get(key);
                if (count > 100) { // Threshold for suspicious activity
                    blockedIPs.push(key.split(':')[2]);
                }
            }

            if (blockedIPs.length > 0) {
                alerts.push({
                    type: 'RATE_LIMIT_VIOLATIONS',
                    severity: 'MEDIUM',
                    message: `${blockedIPs.length} IPs blocked due to rate limit violations`,
                    timestamp: new Date()
                });
            }

            return alerts;
        } catch (error) {
            console.error('Error getting system alerts:', error);
            throw new Error('Failed to get system alerts');
        }
    }

    // Reconcile a transaction manually
    async reconcileTransaction(transactionId, adminId) {
        try {
            const transaction = await Transaction.findById(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Add reconciliation logic here based on transaction type
            const reconciled = await this._reconcileByType(transaction);

            // Update transaction status
            transaction.status = reconciled ? 'COMPLETED' : 'FAILED';
            transaction.lastModifiedBy = adminId;
            transaction.lastModifiedAt = new Date();

            await transaction.save();

            return transaction;
        } catch (error) {
            console.error('Error reconciling transaction:', error);
            throw new Error('Failed to reconcile transaction');
        }
    }

    // Get system health metrics
    async getSystemHealth() {
        try {
            const now = new Date();
            const hourAgo = new Date(now - 60 * 60 * 1000);

            // Get various health metrics
            const [
                recentTransactions,
                activeUsers,
                processingTime,
                errorRate
            ] = await Promise.all([
                Transaction.countDocuments({ timestamp: { $gte: hourAgo } }),
                User.countDocuments({ lastActive: { $gte: hourAgo } }),
                this._getAverageProcessingTime(),
                this._getErrorRate()
            ]);

            // Check Redis health
            const redisHealth = await this._checkRedisHealth();

            return {
                timestamp: now,
                metrics: {
                    transactionsPerHour: recentTransactions,
                    activeUsers,
                    averageProcessingTime: processingTime,
                    errorRate,
                    redisHealth,
                    systemLoad: process.cpuUsage()
                },
                status: this._calculateSystemStatus({
                    errorRate,
                    processingTime,
                    redisHealth
                })
            };
        } catch (error) {
            console.error('Error getting system health:', error);
            throw new Error('Failed to get system health metrics');
        }
    }

    // Private helper methods
    async _getAverageProcessingTime() {
        const transactions = await Transaction.find({
            status: 'COMPLETED',
            timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });

        if (transactions.length === 0) return 0;

        const totalTime = transactions.reduce((sum, tx) => {
            return sum + (tx.completedAt - tx.timestamp);
        }, 0);

        return totalTime / transactions.length;
    }

    async _getErrorRate() {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const [totalCount, failedCount] = await Promise.all([
            Transaction.countDocuments({ timestamp: { $gte: hourAgo } }),
            Transaction.countDocuments({
                timestamp: { $gte: hourAgo },
                status: 'FAILED'
            })
        ]);

        return totalCount === 0 ? 0 : failedCount / totalCount;
    }

    async _checkRedisHealth() {
        try {
            const start = Date.now();
            await redis.ping();
            const latency = Date.now() - start;

            return {
                status: 'healthy',
                latency
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    _calculateSystemStatus({ errorRate, processingTime, redisHealth }) {
        if (errorRate > 0.1 || processingTime > 5000 || redisHealth.status === 'unhealthy') {
            return 'DEGRADED';
        }
        if (errorRate > 0.05 || processingTime > 2000) {
            return 'WARNING';
        }
        return 'HEALTHY';
    }

    async _reconcileByType(transaction) {
        // Add specific reconciliation logic for each transaction type
        switch (transaction.type) {
            case 'PI_DEPOSIT':
            case 'PCM_DEPOSIT':
                // Verify on blockchain
                return await this._verifyDepositOnChain(transaction);
            case 'PI_WITHDRAWAL':
            case 'PCM_WITHDRAWAL':
                // Verify withdrawal completion
                return await this._verifyWithdrawalCompletion(transaction);
            default:
                throw new Error('Unknown transaction type');
        }
    }
}

module.exports = new AdminService();
