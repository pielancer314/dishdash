const { PiNetwork } = require('@pinetwork-js/sdk');
const { Keypair } = require('stellar-sdk');

class PiPaymentService {
  constructor() {
    this.pi = new PiNetwork({
      apiKey: process.env.PI_API_KEY,
      walletPrivateKey: process.env.PI_WALLET_PRIVATE_KEY,
    });

    this.walletKeypair = Keypair.fromSecret(process.env.PI_WALLET_PRIVATE_KEY);
    this.walletPublicKey = this.walletKeypair.publicKey();
  }

  async createPayment(userId, amount, orderId) {
    try {
      const payment = await this.pi.createPayment({
        amount: amount.toString(),
        memo: `Order-${orderId}`,
        metadata: {
          orderId,
          type: 'food_delivery_payment',
          timestamp: new Date().toISOString(),
        },
        uid: userId,
      });

      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async completePayment(paymentId) {
    try {
      const completedPayment = await this.pi.completePayment(paymentId);
      return completedPayment;
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  }

  async cancelPayment(paymentId) {
    try {
      const cancelledPayment = await this.pi.cancelPayment(paymentId);
      return cancelledPayment;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }
}

module.exports = new PiPaymentService();
