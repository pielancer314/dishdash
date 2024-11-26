const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const socketIo = require('socket.io');

let io;

const connections = {
    users: new Map(),
    restaurants: new Map(),
    drivers: new Map()
};

const initialize = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected');
        
        // Store connection based on user type
        if (socket.user.type === 'customer') {
            connections.users.set(socket.user.id, socket);
        } else if (socket.user.type === 'restaurant') {
            connections.restaurants.set(socket.user.id, socket);
        } else if (socket.user.type === 'driver') {
            connections.drivers.set(socket.user.id, socket);
        }

        // Join room based on user type
        socket.join(`${socket.user.type}-${socket.user.id}`);

        // Handle order updates
        socket.on('order:update', async (data) => {
            try {
                const order = await Order.findByIdAndUpdate(
                    data.orderId,
                    { status: data.status },
                    { new: true }
                ).populate('restaurant driver customer');

                // Notify all relevant parties
                notifyOrderUpdate(order);
            } catch (error) {
                socket.emit('error', { message: 'Failed to update order' });
            }
        });

        // Handle driver location updates
        socket.on('driver:location', async (data) => {
            try {
                if (socket.user.type !== 'driver') {
                    throw new Error('Unauthorized');
                }

                const order = await Order.findOne({
                    driver: socket.user.id,
                    status: { $in: ['picked_up', 'on_way'] }
                });

                if (order) {
                    // Notify customer and restaurant about driver location
                    io.to(`customer-${order.customer}`).emit('driver:location', {
                        orderId: order._id,
                        location: data.location
                    });
                    
                    io.to(`restaurant-${order.restaurant}`).emit('driver:location', {
                        orderId: order._id,
                        location: data.location
                    });
                }
            } catch (error) {
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // Handle restaurant status updates
        socket.on('restaurant:status', async (data) => {
            try {
                if (socket.user.type !== 'restaurant') {
                    throw new Error('Unauthorized');
                }

                await Restaurant.findByIdAndUpdate(socket.user.id, {
                    isOpen: data.isOpen
                });

                // Broadcast restaurant status update
                io.emit('restaurant:status', {
                    restaurantId: socket.user.id,
                    isOpen: data.isOpen
                });
            } catch (error) {
                socket.emit('error', { message: 'Failed to update status' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected');
            if (socket.user.type === 'customer') {
                connections.users.delete(socket.user.id);
            } else if (socket.user.type === 'restaurant') {
                connections.restaurants.delete(socket.user.id);
            } else if (socket.user.type === 'driver') {
                connections.drivers.delete(socket.user.id);
            }
        });
    });
};

// Helper function to notify all parties about order updates
async function notifyOrderUpdate(order) {
    const { customer, restaurant, driver } = order;

    // Notify customer
    if (connections.users.has(customer._id.toString())) {
        connections.users.get(customer._id.toString()).emit('order:update', order);
    }

    // Notify restaurant
    if (connections.restaurants.has(restaurant._id.toString())) {
        connections.restaurants.get(restaurant._id.toString()).emit('order:update', order);
    }

    // Notify driver if assigned
    if (driver && connections.drivers.has(driver._id.toString())) {
        connections.drivers.get(driver._id.toString()).emit('order:update', order);
    }

    // If order status is 'pending' and no driver assigned, notify all available drivers
    if (order.status === 'pending' && !driver) {
        connections.drivers.forEach((socket) => {
            socket.emit('order:available', order);
        });
    }
}

module.exports = {
    initialize
};
