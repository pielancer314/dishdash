const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all orders for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('restaurant', 'name coverImage')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name coverImage address')
            .populate('driver', 'name phone');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the order or is the restaurant owner
        if (order.user.toString() !== req.user.id && 
            order.restaurant.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new order
router.post('/', [auth, [
    body('restaurant').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.menuItem').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('deliveryAddress').notEmpty(),
    body('paymentMethod').isIn(['pi_network', 'credit_card', 'wallet'])
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const restaurant = await Restaurant.findById(req.body.restaurant);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Calculate order totals
        let subtotal = 0;
        const items = [];

        for (let item of req.body.items) {
            const menuItem = restaurant.menu.id(item.menuItem);
            if (!menuItem) {
                return res.status(400).json({ message: 'Invalid menu item' });
            }
            if (!menuItem.isAvailable) {
                return res.status(400).json({ message: `${menuItem.name} is not available` });
            }

            subtotal += menuItem.price * item.quantity;
            items.push({
                menuItem: item.menuItem,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            });
        }

        const tax = subtotal * 0.1; // 10% tax
        const deliveryFee = 5; // Fixed delivery fee
        const total = subtotal + tax + deliveryFee;

        const order = new Order({
            user: req.user.id,
            restaurant: restaurant._id,
            items,
            subtotal,
            tax,
            deliveryFee,
            total,
            paymentMethod: req.body.paymentMethod,
            deliveryAddress: req.body.deliveryAddress,
            orderNotes: req.body.orderNotes
        });

        await order.save();
        
        // Populate restaurant details for response
        await order.populate('restaurant', 'name coverImage address');
        
        res.status(201).json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status (protected route - restaurant owners and drivers only)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const restaurant = await Restaurant.findById(order.restaurant);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check authorization
        if (restaurant.owner.toString() !== req.user.id && 
            (order.driver && order.driver.toString() !== req.user.id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Validate status transition
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['preparing'],
            preparing: ['ready'],
            ready: ['picked_up'],
            picked_up: ['delivered', 'cancelled'],
        };

        if (!validTransitions[order.status]?.includes(req.body.status)) {
            return res.status(400).json({ message: 'Invalid status transition' });
        }

        // Update status and timestamps
        order.status = req.body.status;
        if (req.body.status === 'delivered') {
            order.actualDeliveryTime = Date.now();
        }

        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign driver to order (protected route - drivers only)
router.put('/:id/assign-driver', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order is ready for pickup
        if (order.status !== 'ready') {
            return res.status(400).json({ message: 'Order is not ready for pickup' });
        }

        // Check if driver is already assigned
        if (order.driver) {
            return res.status(400).json({ message: 'Order already has a driver assigned' });
        }

        order.driver = req.user.id;
        await order.save();

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
