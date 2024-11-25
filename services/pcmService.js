const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://api.mainnet.minepi.com');

class PCMService {
    constructor() {
        this.server = server;
        this.PCM_ASSET = new StellarSdk.Asset('PCM', process.env.PCM_ISSUER_ADDRESS);
        this.distributorKeypair = StellarSdk.Keypair.fromSecret(process.env.PCM_DISTRIBUTOR_SECRET);
    }

    // Create trustline for PCM token
    async createTrustline(destinationPublicKey) {
        try {
            const account = await this.server.loadAccount(destinationPublicKey);
            
            // Check if trustline already exists
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
                transaction.sign(this.distributorKeypair);
                const result = await this.server.submitTransaction(transaction);
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error creating PCM trustline:', error);
            throw new Error('Failed to create PCM trustline');
        }
    }

    // Send PCM tokens
    async sendPCM(destinationPublicKey, amount) {
        try {
            // First ensure trustline exists
            await this.createTrustline(destinationPublicKey);

            // Load distributor account
            const distributorAccount = await this.server.loadAccount(this.distributorKeypair.publicKey());

            // Create payment transaction
            const transaction = new StellarSdk.TransactionBuilder(distributorAccount, {
                fee: await this.server.fetchBaseFee(),
                networkPassphrase: StellarSdk.Networks.PUBLIC
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: destinationPublicKey,
                asset: this.PCM_ASSET,
                amount: amount.toString()
            }))
            .setTimeout(30)
            .build();

            // Sign and submit transaction
            transaction.sign(this.distributorKeypair);
            const result = await this.server.submitTransaction(transaction);
            return result;
        } catch (error) {
            console.error('Error sending PCM:', error);
            throw new Error('Failed to send PCM');
        }
    }

    // Get PCM balance
    async getPCMBalance(publicKey) {
        try {
            const account = await this.server.loadAccount(publicKey);
            let pcmBalance = '0';

            account.balances.forEach((balance) => {
                if (balance.asset_code === 'PCM' && 
                    balance.asset_issuer === process.env.PCM_ISSUER_ADDRESS) {
                    pcmBalance = balance.balance;
                }
            });

            return pcmBalance;
        } catch (error) {
            console.error('Error getting PCM balance:', error);
            throw new Error('Failed to get PCM balance');
        }
    }

    // Get PCM transaction history
    async getPCMTransactions(publicKey) {
        try {
            const transactions = await this.server.transactions()
                .forAccount(publicKey)
                .limit(50)
                .call();

            const pcmTransactions = [];

            for (const tx of transactions.records) {
                const operations = await tx.operations();
                
                operations.records.forEach(op => {
                    if (op.asset_code === 'PCM' && 
                        op.asset_issuer === process.env.PCM_ISSUER_ADDRESS) {
                        pcmTransactions.push({
                            id: tx.id,
                            createdAt: tx.created_at,
                            type: op.type,
                            amount: op.amount,
                            from: op.from,
                            to: op.to
                        });
                    }
                });
            }

            return pcmTransactions;
        } catch (error) {
            console.error('Error getting PCM transactions:', error);
            throw new Error('Failed to get PCM transactions');
        }
    }

    // Check if account is frozen
    async isAccountFrozen(publicKey) {
        try {
            const account = await this.server.loadAccount(publicKey);
            const pcmTrustline = account.balances.find(
                balance => balance.asset_code === 'PCM' && 
                balance.asset_issuer === process.env.PCM_ISSUER_ADDRESS
            );

            return pcmTrustline ? pcmTrustline.is_frozen : false;
        } catch (error) {
            console.error('Error checking account frozen status:', error);
            throw new Error('Failed to check account status');
        }
    }

    // Get PCM token info
    async getPCMInfo() {
        try {
            const issuerAccount = await this.server.loadAccount(process.env.PCM_ISSUER_ADDRESS);
            const pcmAsset = issuerAccount.balances.find(
                balance => balance.asset_code === 'PCM'
            );

            return {
                code: 'PCM',
                issuer: process.env.PCM_ISSUER_ADDRESS,
                totalSupply: pcmAsset ? pcmAsset.balance : '0',
                domain: issuerAccount.home_domain,
                flags: pcmAsset ? {
                    authRequired: pcmAsset.flags.auth_required,
                    authRevocable: pcmAsset.flags.auth_revocable,
                    authImmutable: pcmAsset.flags.auth_immutable
                } : null
            };
        } catch (error) {
            console.error('Error getting PCM info:', error);
            throw new Error('Failed to get PCM info');
        }
    }
}

module.exports = new PCMService();
