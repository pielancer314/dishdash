const express = require('express');
const router = express.Router();

// Sample data (replace with database in production)
const restaurants = [
    {
        id: 1,
        name: "Pizza Paradise",
        coverImage: "/images/restaurants/pizza-paradise.jpg",
        rating: 4.5,
        reviewCount: 234,
        cuisineType: "Italian, Pizza",
        deliveryTime: "25-35",
        menu: [
            {
                category: "Popular Items",
                items: [
                    {
                        id: 1,
                        name: "Margherita Pizza",
                        description: "Fresh tomatoes, mozzarella, basil",
                        price: 12.99,
                        image: "/images/menu/margherita.jpg",
                        isVeg: true
                    },
                    {
                        id: 2,
                        name: "Pepperoni Pizza",
                        description: "Classic pepperoni with extra cheese",
                        price: 14.99,
                        image: "/images/menu/pepperoni.jpg",
                        isVeg: false
                    }
                ]
            }
        ]
    }
];

// Get all restaurants
router.get('/', (req, res) => {
    res.json(restaurants);
});

// Search restaurants
router.get('/search', (req, res) => {
    const { q } = req.query;
    const results = restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(q.toLowerCase()) ||
        restaurant.cuisineType.toLowerCase().includes(q.toLowerCase())
    );
    res.json(results);
});

// Get restaurant by ID
router.get('/:id', (req, res) => {
    const restaurant = restaurants.find(r => r.id === parseInt(req.params.id));
    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
});

// Get restaurant menu
router.get('/:id/menu', (req, res) => {
    const restaurant = restaurants.find(r => r.id === parseInt(req.params.id));
    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant.menu);
});

module.exports = router;
