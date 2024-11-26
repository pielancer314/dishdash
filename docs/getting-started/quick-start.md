# Quick Start Guide

This guide will help you get Food Pi Hub up and running quickly.

## Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- Pi Network Developer Account
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/pielancer314/food-pi-hub.git
cd food-pi-hub
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure your environment variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/foodpihub
PI_API_KEY=your_pi_api_key
PI_WALLET_PRIVATE_KEY=your_wallet_private_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the development server:
```bash
npm run dev
```

3. Visit `http://localhost:3000` in your browser

## Basic Usage

### For Customers
1. Create an account or log in
2. Browse restaurants
3. Place orders
4. Track delivery

### For Restaurant Owners
1. Register your restaurant
2. Manage menu items
3. Process orders
4. View analytics

### For Drivers
1. Sign up as a driver
2. Accept deliveries
3. Update delivery status
4. Track earnings

## Testing

Run the test suite:
```bash
npm test
```

## Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/your-feature
```

2. Make your changes and commit:
```bash
git add .
git commit -m "Add your feature"
```

3. Push changes and create a pull request:
```bash
git push origin feature/your-feature
```

## Need Help?

- Check our [FAQ](../troubleshooting/faq.md)
- Join our [Discord community](https://discord.gg/foodpihub)
- Email support: support@foodpihub.com

## Next Steps

- Read the [Architecture Overview](../architecture/system-overview.md)
- Explore the [API Documentation](../api/README.md)
- Learn about [Security Best Practices](../security/best-practices.md)
