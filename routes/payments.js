const express = require('express');
const router = express.Router();
const piPaymentService = require('../services/piPaymentService');

// Create payment
router.post('/create', async (req, res) => {
    try {
        const { userId, amount, orderId } = req.body;
        const payment = await piPaymentService.createPayment(userId, amount, orderId);
        res.json(payment);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Failed to create payment' });
    }
});

// Complete payment
router.post('/complete', async (req, res) => {
    try {
        const { paymentId } = req.body;
        const payment = await piPaymentService.completePayment(paymentId);
        res.json(payment);
    } catch (error) {
        console.error('Error completing payment:', error);
        res.status(500).json({ message: 'Failed to complete payment' });
    }
});

// Cancel payment
router.post('/cancel', async (req, res) => {
    try {
        const { paymentId } = req.body;
        const payment = await piPaymentService.cancelPayment(paymentId);
        res.json(payment);
    } catch (error) {
        console.error('Error cancelling payment:', error);
        res.status(500).json({ message: 'Failed to cancel payment' });
    }
});

// Get payment status
router.get('/:paymentId', async (req, res) => {
    try {
        const payment = await piPaymentService.getPayment(req.params.paymentId);
        res.json(payment);
    } catch (error) {
        console.error('Error getting payment:', error);
        res.status(500).json({ message: 'Failed to get payment status' });
    }
});

module.exports = router;
