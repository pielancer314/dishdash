// Configuration for the Food Pi Hub application
module.exports = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },
    
    // Database configuration
    database: {
        url: process.env.MONGODB_URI || 'mongodb://localhost:27017/foodpihub'
    },
    
    // Pi Network configuration
    piNetwork: {
        apiKey: process.env.PI_API_KEY,
        walletPrivateKey: process.env.PI_WALLET_PRIVATE_KEY,
        sandbox: process.env.NODE_ENV !== 'production'
    },
    
    // JWT configuration for authentication
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '24h'
    },
    
    // API rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // CORS configuration
    cors: {
        origin: process.env.NODE_ENV === 'production' ? 'https://foodpihub.com' : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
};
