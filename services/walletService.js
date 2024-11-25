const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://api.mainnet.minepi.com');
const piPaymentService = require('./piPaymentService');

class WalletService {
    constructor() {
        this.server = server;
        this.PCM_ASSET = new StellarSdk.Asset('PCM', process.env.PCM_ISSUER_ADDRESS);
    }

    // Create a new wallet for user
    async createWallet(userId) {
        try {
            const pair = StellarSdk.Keypair.random();
            const publicKey = pair.publicKey();
            const secretKey = pair.secret();

            // Store wallet info securely (encrypt secret key before storing)
            // This is just an example - implement secure storage in production
            await User.findByIdAndUpdate(userId, {
                wallet: {
                    publicKey,
                    encryptedSecretKey: secretKey // Implement encryption
                }
            });

            return { publicKey };
        } catch (error) {
            console.error('Error creating wallet:', error);
            throw new Error('Failed to create wallet');
        }
    }

    // Get wallet balance
    async getBalance(publicKey) {
        try {
            const account = await this.server.loadAccount(publicKey);
            const balances = {
                PI: '0',
                PCM: '0'
            };

            account.balances.forEach((balance) => {
                if (balance.asset_type === 'native') {
                    balances.PI = balance.balance;
                } else if (balance.asset_code === 'PCM' && balance.asset_issuer === process.env.PCM_ISSUER_ADDRESS) {
                    balances.PCM = balance.balance;
                }
            });

            return balances;
        } catch (error) {
            console.error('Error getting balance:', error);
            throw new Error('Failed to get wallet balance');
        }
    }

    // Deposit Pi coins
    async depositPi(userId, amount) {
        try {
            const user = await User.findById(userId);
            if (!user.wallet?.publicKey) {
                throw new Error('User wallet not found');
            }

            const payment = await piPaymentService.createPayment(userId, amount, {
                type: 'DEPOSIT',
                destinationAddress: user.wallet.publicKey
            });

            return payment;
        } catch (error) {
            console.error('Error depositing Pi:', error);
            throw new Error('Failed to deposit Pi');
        }
    }

    // Deposit PCM tokens
    async depositPcm(userId, amount) {
        try {
            const user = await User.findById(userId);
            if (!user.wallet?.publicKey) {
                throw new Error('User wallet not found');
            }

            // Create a trust line for PCM if it doesn't exist
            await this.createPcmTrustline(user.wallet.publicKey);

            // Create payment operation for PCM
            const payment = await piPaymentService.createPayment(userId, amount, {
                type: 'DEPOSIT_PCM',
                destinationAddress: user.wallet.publicKey,
                asset: this.PCM_ASSET
            });

            return payment;
        } catch (error) {
            console.error('Error depositing PCM:', error);
            throw new Error('Failed to deposit PCM');
        }
    }

    // Create trustline for PCM token
    async createPcmTrustline(publicKey) {
        try {
            const account = await this.server.loadAccount(publicKey);
            const hasTrustline = account.balances.some(
                balance => balance.asset_code === 'PCM' && 
                balance.asset_issuer === process.env.PCM_ISSUER_ADDRESS
            );

            if (!hasTrustline) {
                const transaction = new StellarSdk.TransactionBuilder(account, {
                    fee: await this.server.fetchBaseFee(),
                    networkPassphrase: StellarSdk.Networks.PUBLIC
                })
                .addOperation(StellarSdk.Operation.changeTrust({
                    asset: this.PCM_ASSET,
                    limit: '1000000' // Adjust limit as needed
                }))
                .setTimeout(30)
                .build();

                // Sign and submit transaction
                // Implement secure key management in production
                const sourceKeypair = StellarSdk.Keypair.fromSecret(user.wallet.encryptedSecretKey);
                transaction.sign(sourceKeypair);
                await this.server.submitTransaction(transaction);
            }
        } catch (error) {
            console.error('Error creating PCM trustline:', error);
            throw new Error('Failed to create PCM trustline');
        }
    }

    // Get transaction history
    async getTransactionHistory(publicKey) {
        try {
            const transactions = await this.server.transactions()
                .forAccount(publicKey)
                .order('desc')
                .limit(20)
                .call();

            const history = await Promise.all(transactions.records.map(async (tx) => {
                const operations = await tx.operations();
                return {
                    id: tx.id,
                    createdAt: tx.created_at,
                    operations: operations.records.map(op => ({
                        type: op.type,
                        amount: op.amount,
                        asset: op.asset_type === 'native' ? 'PI' : op.asset_code,
                        from: op.from,
                        to: op.to
                    }))
                };
            }));

            return history;
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw new Error('Failed to get transaction history');
        }
    }
}

module.exports = new WalletService();
