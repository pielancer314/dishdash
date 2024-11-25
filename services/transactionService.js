const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['PI_DEPOSIT', 'PI_WITHDRAWAL', 'PCM_DEPOSIT', 'PCM_WITHDRAWAL'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    txHash: String,
    fromAddress: String,
    toAddress: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    fee: Number,
    memo: String,
    errorMessage: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

class TransactionService {
    // Create new transaction record
    async createTransaction(data) {
        try {
            const transaction = new Transaction(data);
            await transaction.save();
            return transaction;
        } catch (error) {
            console.error('Error creating transaction:', error);
            throw new Error('Failed to create transaction record');
        }
    }

    // Update transaction status
    async updateTransactionStatus(transactionId, status, txHash = null, errorMessage = null) {
        try {
            const update = {
                status,
                ...(txHash && { txHash }),
                ...(errorMessage && { errorMessage })
            };

            const transaction = await Transaction.findByIdAndUpdate(
                transactionId,
                update,
                { new: true }
            );

            return transaction;
        } catch (error) {
            console.error('Error updating transaction:', error);
            throw new Error('Failed to update transaction status');
        }
    }

    // Get user's transaction history
    async getUserTransactions(userId, options = {}) {
        try {
            const {
                type,
                status,
                startDate,
                endDate,
                limit = 50,
                skip = 0,
                sort = { timestamp: -1 }
            } = options;

            const query = { userId };

            if (type) query.type = type;
            if (status) query.status = status;
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) query.timestamp.$gte = new Date(startDate);
                if (endDate) query.timestamp.$lte = new Date(endDate);
            }

            const transactions = await Transaction.find(query)
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
            console.error('Error fetching transactions:', error);
            throw new Error('Failed to fetch transaction history');
        }
    }

    // Get transaction details
    async getTransactionDetails(transactionId) {
        try {
            const transaction = await Transaction.findById(transactionId)
                .populate('userId', 'email username')
                .exec();

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            return transaction;
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            throw new Error('Failed to fetch transaction details');
        }
    }

    // Get transaction statistics
    async getTransactionStats(userId, period = '24h') {
        try {
            const now = new Date();
            let startDate;

            switch (period) {
                case '24h':
                    startDate = new Date(now - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now - 24 * 60 * 60 * 1000);
            }

            const stats = await Transaction.aggregate([
                {
                    $match: {
                        userId: mongoose.Types.ObjectId(userId),
                        timestamp: { $gte: startDate },
                        status: 'COMPLETED'
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        avgAmount: { $avg: '$amount' },
                        totalFees: { $sum: '$fee' }
                    }
                }
            ]);

            return stats;
        } catch (error) {
            console.error('Error calculating transaction stats:', error);
            throw new Error('Failed to calculate transaction statistics');
        }
    }

    // Delete pending transactions older than specified time
    async cleanupPendingTransactions(maxAge = '1h') {
        try {
            const maxAgeMs = maxAge === '1h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const cutoffDate = new Date(Date.now() - maxAgeMs);

            const result = await Transaction.deleteMany({
                status: 'PENDING',
                timestamp: { $lt: cutoffDate }
            });

            return result.deletedCount;
        } catch (error) {
            console.error('Error cleaning up pending transactions:', error);
            throw new Error('Failed to cleanup pending transactions');
        }
    }
}

module.exports = new TransactionService();
