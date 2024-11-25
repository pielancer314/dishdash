const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizers', 'mains', 'sides', 'desserts', 'drinks'],
  },
  customization: [{
    name: String,
    options: [{
      name: String,
      price: Number,
    }],
    required: Boolean,
  }],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number, // in minutes
    required: true,
  },
});

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    cuisine: [{
      type: String,
      required: true,
    }],
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    images: [{
      type: String,
    }],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    menu: [menuItemSchema],
    openingHours: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true,
      },
      open: {
        type: String,
        required: true,
      },
      close: {
        type: String,
        required: true,
      },
      isClosed: {
        type: Boolean,
        default: false,
      },
    }],
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumOrder: {
      type: Number,
      required: true,
      min: 0,
    },
    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },
    acceptedPayments: [{
      type: String,
      enum: ['CARD', 'ETH', 'BTC', 'PCM', 'PI'],
      required: true,
    }],
    walletAddresses: [{
      chain: {
        type: String,
        enum: ['ETH', 'BTC', 'PCM', 'PI'],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'menu.name': 'text', 'menu.description': 'text' });

// Virtual for isOpen
restaurantSchema.virtual('isOpen').get(function() {
  const now = new Date();
  const day = now.toLocaleLowerCase('en-US', { weekday: 'long' });
  const time = now.toLocaleTimeString('en-US', { hour12: false });
  
  const todayHours = this.openingHours.find(h => h.day === day);
  if (!todayHours || todayHours.isClosed) return false;
  
  return time >= todayHours.open && time <= todayHours.close;
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
