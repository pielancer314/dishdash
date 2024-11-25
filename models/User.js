const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    piUserId: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    addresses: [{
        street: String,
        city: String,
        state: String,
        zipCode: String,
        isDefault: Boolean
    }],
    role: {
        type: String,
        enum: ['user', 'admin', 'restaurant'],
        default: 'user'
    },
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Generate auth token
userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { 
            id: this._id,
            role: this.role,
            email: this.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
