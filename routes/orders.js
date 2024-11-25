const express = require('express');
const router = express.Router();
const piPaymentService = require('../services/piPaymentService');

// Sample data (replace with database in production)
let orders = [];

// Create new order
router.post('/', async (req, res) => {
    try {
        const { items, address, payment } = req.body;

        // Validate payment with Pi Network
        const verifiedPayment = await piPaymentService.completePayment(payment.id);
        if (verifiedPayment.status !== 'completed') {
            return res.status(400).json({ message: 'Payment verification failed' });
        }

        // Create order
        const order = {
            id: Date.now().toString(),
            items,
            address,
            payment,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            estimatedDeliveryTime: '30-45 minutes'
        };

        orders.push(order);

        // In production, you would:
        // 1. Save order to database
        // 2. Send confirmation email
        // 3. Notify restaurant
        // 4. Start delivery tracking

        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
});

// Get order by ID
router.get('/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
});

// Update order status
router.patch('/:id/status', (req, res) => {
    const { status } = req.body;
    const order = orders.find(o => o.id === req.params.id);
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    res.json(order);
});

// Get user's order history
router.get('/user/:userId', (req, res) => {
    const userOrders = orders.filter(order => order.userId === req.params.userId);
    res.json(userOrders);
});

module.exports = router;
