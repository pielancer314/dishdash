const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addresses: [
      {
        type: {
          type: String,
          enum: ['home', 'work', 'other'],
          default: 'home',
        },
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
      },
    ],
    walletAddresses: [
      {
        chain: {
          type: String,
          enum: ['ETH', 'BTC', 'PCM', 'PI'],
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'restaurant_owner'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
userSchema.index({ 'addresses.location': '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Add wallet address method
userSchema.methods.addWalletAddress = function (chain, address) {
  const existingWallet = this.walletAddresses.find(w => w.chain === chain);
  if (existingWallet) {
    existingWallet.address = address;
  } else {
    this.walletAddresses.push({ chain, address });
  }
  return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
