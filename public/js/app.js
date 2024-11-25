// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// App state
let currentUser = null;
let cart = [];

// Authentication
async function authenticate() {
    try {
        const scopes = ['payments'];
        const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
        currentUser = auth.user;
        updateUI();
    } catch (error) {
        console.error('Pi Authentication error:', error);
    }
}

// Handle incomplete payments
async function onIncompletePaymentFound(payment) {
    try {
        await fetch('/api/payments/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentId: payment.identifier }),
        });
    } catch (error) {
        console.error('Error completing payment:', error);
    }
}

// Payment handling
async function createPayment(amount, orderId) {
    try {
        const payment = await Pi.createPayment({
            amount: amount.toString(),
            memo: `Order-${orderId}`,
            metadata: { orderId },
        });

        const response = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentId: payment.identifier,
                orderId,
                amount,
            }),
        });

        return response.json();
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
    }
}

// Cart management
function addToCart(item) {
    cart.push(item);
    updateCartUI();
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
}

function updateCartUI() {
    // Update cart display
    const cartTotal = cart.reduce((total, item) => total + item.price, 0);
    document.getElementById('cart-total').textContent = `π${cartTotal.toFixed(2)}`;
}

// Search functionality
const searchInput = document.querySelector('input[type="text"]');
searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch(event) {
    const query = event.target.value;
    if (query.length < 2) return;

    fetch(`/api/restaurants/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(results => {
            // Update search results UI
        })
        .catch(error => console.error('Search error:', error));
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    authenticate();
});
