const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    isVeg: { type: Boolean, default: false },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number }, // in minutes
});

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    coverImage: { type: String },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    cuisineType: { type: String, required: true },
    deliveryTime: { type: String },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    menu: [menuItemSchema],
    isOpen: { type: Boolean, default: true },
    openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
restaurantSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better search performance
restaurantSchema.index({ name: 'text', cuisineType: 'text' });
restaurantSchema.index({ 'address.city': 1, 'address.state': 1 });
restaurantSchema.index({ rating: -1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
