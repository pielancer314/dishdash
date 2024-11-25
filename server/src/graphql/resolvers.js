const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

const pubsub = new PubSub();

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await User.findById(user.id);
    },

    user: async (_, { id }) => {
      return await User.findById(id);
    },

    users: async () => {
      return await User.find({});
    },

    restaurant: async (_, { id }) => {
      return await Restaurant.findById(id);
    },

    restaurants: async (_, { search, category, location, limit = 10, offset = 0 }) => {
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (category) {
        query['categories.name'] = category;
      }

      if (location) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude],
            },
            $maxDistance: 10000, // 10km
          },
        };
      }

      return await Restaurant.find(query)
        .skip(offset)
        .limit(limit);
    },

    order: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await Order.findById(id)
        .populate('user')
        .populate('restaurant')
        .populate('items.menuItem');
    },

    orders: async (_, { status }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      const query = { user: user.id };
      if (status) query.status = status;

      return await Order.find(query)
        .populate('user')
        .populate('restaurant')
        .populate('items.menuItem')
        .sort({ createdAt: -1 });
    },
  },

  Mutation: {
    signup: async (_, { email, password, name, phone }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new UserInputError('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'USER',
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new UserInputError('Invalid email or password');
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new UserInputError('Invalid email or password');
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return { token, user };
    },

    updateProfile: async (_, args, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const updates = {};
      if (args.name) updates.name = args.name;
      if (args.phone) updates.phone = args.phone;

      if (args.currentPassword && args.newPassword) {
        const currentUser = await User.findById(user.id);
        const validPassword = await bcrypt.compare(
          args.currentPassword,
          currentUser.password
        );

        if (!validPassword) {
          throw new UserInputError('Current password is incorrect');
        }

        updates.password = await bcrypt.hash(args.newPassword, 10);
      }

      return await User.findByIdAndUpdate(user.id, updates, { new: true });
    },

    addAddress: async (_, { address }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      return await User.findByIdAndUpdate(
        user.id,
        {
          $push: {
            address: {
              ...address,
              location: {
                type: 'Point',
                coordinates: [address.location.longitude, address.location.latitude],
              },
            },
          },
        },
        { new: true }
      );
    },

    removeAddress: async (_, { addressId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      return await User.findByIdAndUpdate(
        user.id,
        {
          $pull: { address: { _id: addressId } },
        },
        { new: true }
      );
    },

    createOrder: async (_, { restaurantId, items, addressId, paymentMethod }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        throw new UserInputError('Restaurant not found');
      }

      const userDoc = await User.findById(user.id);
      const deliveryAddress = userDoc.address.id(addressId);
      if (!deliveryAddress) {
        throw new UserInputError('Delivery address not found');
      }

      // Calculate total
      let total = 0;
      const orderItems = await Promise.all(
        items.map(async (item) => {
          const menuItem = restaurant.menu.id(item.menuItemId);
          if (!menuItem) {
            throw new UserInputError(`Menu item ${item.menuItemId} not found`);
          }

          let itemTotal = menuItem.price * item.quantity;

          // Add options cost
          if (item.optionIds) {
            item.optionIds.forEach((optionId) => {
              const option = menuItem.options.id(optionId);
              if (option) {
                itemTotal += option.price * item.quantity;
              }
            });
          }

          // Add variations cost
          if (item.variationIds) {
            item.variationIds.forEach((variationId) => {
              const variation = menuItem.variations.id(variationId);
              if (variation) {
                itemTotal += variation.price * item.quantity;
              }
            });
          }

          total += itemTotal;

          return {
            menuItem: item.menuItemId,
            quantity: item.quantity,
            options: item.optionIds,
            variations: item.variationIds,
            specialInstructions: item.specialInstructions,
          };
        })
      );

      // Add delivery fee
      total += restaurant.deliveryFee || 0;

      const order = await Order.create({
        user: user.id,
        restaurant: restaurantId,
        items: orderItems,
        total,
        status: 'PENDING',
        deliveryAddress,
        paymentMethod,
      });

      const populatedOrder = await Order.findById(order.id)
        .populate('user')
        .populate('restaurant')
        .populate('items.menuItem');

      // Notify about new order
      pubsub.publish('ORDER_STATUS_CHANGED', {
        orderStatusChanged: populatedOrder,
      });

      return populatedOrder;
    },

    updateOrderStatus: async (_, { orderId, status }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const order = await Order.findById(orderId)
        .populate('user')
        .populate('restaurant')
        .populate('items.menuItem');

      if (!order) {
        throw new UserInputError('Order not found');
      }

      // Check authorization
      if (user.role !== 'ADMIN' && order.restaurant.owner.toString() !== user.id) {
        throw new AuthenticationError('Not authorized');
      }

      order.status = status;
      await order.save();

      // Notify about status change
      pubsub.publish('ORDER_STATUS_CHANGED', {
        orderStatusChanged: order,
      });

      return order;
    },

    cancelOrder: async (_, { orderId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const order = await Order.findById(orderId)
        .populate('user')
        .populate('restaurant')
        .populate('items.menuItem');

      if (!order) {
        throw new UserInputError('Order not found');
      }

      // Only allow cancellation if order is pending
      if (order.status !== 'PENDING') {
        throw new UserInputError('Order cannot be cancelled');
      }

      // Check authorization
      if (order.user.id !== user.id && user.role !== 'ADMIN') {
        throw new AuthenticationError('Not authorized');
      }

      order.status = 'CANCELLED';
      await order.save();

      // Notify about cancellation
      pubsub.publish('ORDER_STATUS_CHANGED', {
        orderStatusChanged: order,
      });

      return order;
    },
  },

  Subscription: {
    orderStatusChanged: {
      subscribe: (_, { orderId }) => {
        return pubsub.asyncIterator(`ORDER_STATUS_CHANGED`);
      },
    },
  },
};

module.exports = resolvers;
