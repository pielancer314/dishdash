const StellarSdk = require('stellar-sdk');
const transactionService = require('./transactionService');
const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

class WithdrawalService {
    constructor() {
        this.server = server;
        this.PCM_ASSET = new StellarSdk.Asset('PCM', process.env.PCM_ISSUER_ADDRESS);
    }

    // Validate withdrawal request
    async validateWithdrawal(userId, amount, currency, currentBalance) {
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error('Invalid withdrawal amount');
        }

        if (amount > currentBalance) {
            throw new Error('Insufficient balance');
        }

        // Check for withdrawal limits
        const dailyStats = await transactionService.getTransactionStats(userId, '24h');
        const withdrawalStats = dailyStats.find(stat => 
            stat._id === (currency === 'PI' ? 'PI_WITHDRAWAL' : 'PCM_WITHDRAWAL')
        );

        const dailyLimit = currency === 'PI' ? 1000 : 5000; // Example limits
        if (withdrawalStats && withdrawalStats.totalAmount + amount > dailyLimit) {
            throw new Error('Daily withdrawal limit exceeded');
        }
    }

    // Process Pi withdrawal
    async withdrawPi(userId, amount, destinationAddress) {
        try {
            // Create transaction record
            const transaction = await transactionService.createTransaction({
                userId,
                type: 'PI_WITHDRAWAL',
                amount,
                toAddress: destinationAddress
            });

            // Load account
            const sourceAccount = await this.server.loadAccount(process.env.PI_WALLET_ADDRESS);
            
            // Build transaction
            const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: await this.server.fetchBaseFee(),
                networkPassphrase: StellarSdk.Networks.PUBLIC
            });

            // Add payment operation
            txBuilder.addOperation(StellarSdk.Operation.payment({
                destination: destinationAddress,
                asset: StellarSdk.Asset.native(),
                amount: amount.toString()
            }));

            // Add memo
            txBuilder.addMemo(StellarSdk.Memo.text(`Food Pi Hub withdrawal: ${transaction._id}`));
            
            // Set timeout and build
            const tx = txBuilder.setTimeout(30).build();

            // Sign transaction
            const sourceKeys = StellarSdk.Keypair.fromSecret(process.env.PI_WALLET_PRIVATE_KEY);
            tx.sign(sourceKeys);

            // Submit transaction
            const result = await this.server.submitTransaction(tx);

            // Update transaction record
            await transactionService.updateTransactionStatus(
                transaction._id,
                'COMPLETED',
                result.hash
            );

            return {
                success: true,
                transactionId: transaction._id,
                txHash: result.hash
            };
        } catch (error) {
            console.error('Pi withdrawal error:', error);
            throw new Error('Failed to process Pi withdrawal');
        }
    }

    // Process PCM withdrawal
    async withdrawPcm(userId, amount, destinationAddress) {
        try {
            // Create transaction record
            const transaction = await transactionService.createTransaction({
                userId,
                type: 'PCM_WITHDRAWAL',
                amount,
                toAddress: destinationAddress
            });

            // Load account
            const sourceAccount = await this.server.loadAccount(process.env.PCM_DISTRIBUTOR_ADDRESS);
            
            // Build transaction
            const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: await this.server.fetchBaseFee(),
                networkPassphrase: StellarSdk.Networks.PUBLIC
            });

            // Add payment operation
            txBuilder.addOperation(StellarSdk.Operation.payment({
                destination: destinationAddress,
                asset: this.PCM_ASSET,
                amount: amount.toString()
            }));

            // Add memo
            txBuilder.addMemo(StellarSdk.Memo.text(`Food Pi Hub PCM withdrawal: ${transaction._id}`));
            
            // Set timeout and build
            const tx = txBuilder.setTimeout(30).build();

            // Sign transaction
            const sourceKeys = StellarSdk.Keypair.fromSecret(process.env.PCM_DISTRIBUTOR_SECRET);
            tx.sign(sourceKeys);

            // Submit transaction
            const result = await this.server.submitTransaction(tx);

            // Update transaction record
            await transactionService.updateTransactionStatus(
                transaction._id,
                'COMPLETED',
                result.hash
            );

            return {
                success: true,
                transactionId: transaction._id,
                txHash: result.hash
            };
        } catch (error) {
            console.error('PCM withdrawal error:', error);
            throw new Error('Failed to process PCM withdrawal');
        }
    }

    // Get withdrawal fees
    async getWithdrawalFees(currency = 'PI') {
        try {
            const baseFee = await this.server.fetchBaseFee();
            const operationCount = 1; // Basic withdrawal uses 1 operation
            
            return {
                baseFee,
                totalFee: baseFee * operationCount,
                currency: currency
            };
        } catch (error) {
            console.error('Error fetching withdrawal fees:', error);
            throw new Error('Failed to fetch withdrawal fees');
        }
    }

    // Estimate withdrawal time
    async estimateWithdrawalTime(amount, currency) {
        // This is a simplified example. In a real application, you might want to:
        // 1. Check network congestion
        // 2. Consider the amount being withdrawn
        // 3. Look at historical transaction times
        const baseTime = 5000; // 5 seconds base time
        const amountFactor = Math.floor(amount / 1000) * 1000; // Additional time for larger amounts
        
        return {
            estimatedSeconds: baseTime + amountFactor,
            currency: currency
        };
    }
}

module.exports = new WithdrawalService();
