const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id });

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new Error();
        }
        next();
    } catch (error) {
        res.status(403).json({ message: 'Access denied' });
    }
};

// Check if user is restaurant owner
const isRestaurant = async (req, res, next) => {
    try {
        if (req.user.role !== 'restaurant') {
            throw new Error();
        }
        next();
    } catch (error) {
        res.status(403).json({ message: 'Access denied' });
    }
};

// Check if user owns the restaurant
const ownsRestaurant = async (req, res, next) => {
    try {
        const restaurantId = req.params.restaurantId;
        const restaurant = await Restaurant.findById(restaurantId);
        
        if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString()) {
            throw new Error();
        }
        
        req.restaurant = restaurant;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Access denied' });
    }
};

module.exports = {
    auth,
    isAdmin,
    isRestaurant,
    ownsRestaurant
};
