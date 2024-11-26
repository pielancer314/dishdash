const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all restaurants
router.get('/', async (req, res) => {
    try {
        const restaurants = await Restaurant.find()
            .select('-menu') // Exclude menu for performance
            .sort({ rating: -1 });
        res.json(restaurants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Search restaurants
router.get('/search', async (req, res) => {
    try {
        const { q, cuisine, city } = req.query;
        let query = {};

        if (q) {
            query.$text = { $search: q };
        }
        if (cuisine) {
            query.cuisineType = { $regex: cuisine, $options: 'i' };
        }
        if (city) {
            query['address.city'] = { $regex: city, $options: 'i' };
        }

        const restaurants = await Restaurant.find(query)
            .select('-menu')
            .sort({ rating: -1 });
        res.json(restaurants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get restaurant by ID with menu
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new restaurant (protected route)
router.post('/', [auth, [
    body('name').notEmpty().trim(),
    body('cuisineType').notEmpty().trim(),
    body('address.street').notEmpty().trim(),
    body('address.city').notEmpty().trim(),
    body('address.state').notEmpty().trim(),
    body('address.zipCode').notEmpty().trim()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const restaurant = new Restaurant({
            ...req.body,
            owner: req.user.id
        });
        await restaurant.save();
        res.status(201).json(restaurant);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update restaurant (protected route)
router.put('/:id', auth, async (req, res) => {
    try {
        let restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(restaurant);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete restaurant (protected route)
router.delete('/:id', auth, async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await restaurant.remove();
        res.json({ message: 'Restaurant removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
