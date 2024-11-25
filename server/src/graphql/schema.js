const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    phone: String
    address: [Address]
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Address {
    id: ID!
    title: String!
    address: String!
    location: Location!
  }

  type Location {
    type: String!
    coordinates: [Float]!
  }

  type Restaurant {
    id: ID!
    name: String!
    description: String
    image: String
    address: String!
    location: Location!
    categories: [Category]!
    menu: [MenuItem]!
    rating: Float
    deliveryTime: Int
    minimumOrder: Float
    deliveryFee: Float
    isOpen: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Category {
    id: ID!
    name: String!
    description: String
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String
    image: String
    price: Float!
    category: Category!
    options: [MenuItemOption]
    variations: [MenuItemVariation]
  }

  type MenuItemOption {
    id: ID!
    name: String!
    price: Float!
  }

  type MenuItemVariation {
    id: ID!
    name: String!
    price: Float!
  }

  type Order {
    id: ID!
    user: User!
    restaurant: Restaurant!
    items: [OrderItem]!
    total: Float!
    status: OrderStatus!
    deliveryAddress: Address!
    paymentMethod: PaymentMethod!
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    id: ID!
    menuItem: MenuItem!
    quantity: Int!
    options: [MenuItemOption]
    variations: [MenuItemVariation]
    specialInstructions: String
  }

  enum OrderStatus {
    PENDING
    ACCEPTED
    PREPARING
    READY_FOR_PICKUP
    OUT_FOR_DELIVERY
    DELIVERED
    CANCELLED
  }

  enum PaymentMethod {
    CASH
    CARD
    ETHEREUM
    BITCOIN
    PI_COIN
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    user(id: ID!): User
    users: [User]!
    restaurant(id: ID!): Restaurant
    restaurants(
      search: String
      category: String
      location: LocationInput
      limit: Int
      offset: Int
    ): [Restaurant]!
    order(id: ID!): Order
    orders(status: OrderStatus): [Order]!
  }

  input LocationInput {
    latitude: Float!
    longitude: Float!
  }

  input AddressInput {
    title: String!
    address: String!
    location: LocationInput!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
    optionIds: [ID]
    variationIds: [ID]
    specialInstructions: String
  }

  type Mutation {
    signup(
      email: String!
      password: String!
      name: String!
      phone: String
    ): AuthPayload!
    
    login(email: String!, password: String!): AuthPayload!
    
    updateProfile(
      name: String
      phone: String
      currentPassword: String
      newPassword: String
    ): User!
    
    addAddress(address: AddressInput!): User!
    
    removeAddress(addressId: ID!): User!
    
    createOrder(
      restaurantId: ID!
      items: [OrderItemInput]!
      addressId: ID!
      paymentMethod: PaymentMethod!
    ): Order!
    
    updateOrderStatus(
      orderId: ID!
      status: OrderStatus!
    ): Order!
    
    cancelOrder(orderId: ID!): Order!
  }

  type Subscription {
    orderStatusChanged(orderId: ID!): Order!
  }
`;

module.exports = typeDefs;
