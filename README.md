# Food-pi-hub - Pi Network Food Delivery Platform

A modern food delivery platform with integrated Pi Network payments, supporting both Pi Coin and PCM token transactions.

## Features

### Wallet Management System
- Comprehensive transaction tracking
- Support for Pi Coin and PCM token transactions
- Secure deposit and withdrawal functionality
- Advanced transaction filtering and pagination

### Admin Dashboard
- System-wide transaction monitoring
- Real-time system health metrics
- Automated and manual transaction reconciliation
- Comprehensive alerting system

### Security Features
- Rate limiting middleware
- Role-based access control
- Transaction validation
- Detailed error tracking

## Prerequisites

- Node.js (v14+)
- MongoDB
- Redis
- Pi Network API Key
- Pi Network Wallet Keys
- PCM Token Configuration

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/dishdash.git
cd dishdash
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
```

## Environment Variables

Required environment variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dishdash
PI_API_KEY=your_pi_api_key
PI_WALLET_PRIVATE_KEY=your_wallet_private_key
PI_SANDBOX_MODE=true
JWT_SECRET=your_jwt_secret_key_here
PCM_ISSUER_ADDRESS=your_pcm_issuer_address
PCM_DISTRIBUTOR_ADDRESS=your_pcm_distributor_address
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Wallet Operations
- GET /api/wallet/balance
- POST /api/wallet/deposit
- POST /api/wallet/withdraw
- GET /api/wallet/transactions

### Admin Dashboard
- GET /api/admin/overview
- GET /api/admin/transactions
- GET /api/admin/system-health
- POST /api/admin/reconcile

## Security

- JWT-based authentication
- Rate limiting on sensitive endpoints
- Role-based access control
- Transaction validation
- Secure key management

## Testing

Run the test suite:
```bash
npm test
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
