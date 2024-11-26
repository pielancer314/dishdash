// Pi Network SDK Integration
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// Socket.IO connection
let socket;

// UI Elements
const cartButton = document.getElementById('cart-button');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartButton = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartBadge = document.getElementById('cart-badge');
const searchInput = document.querySelector('.search-bar input');
const searchResults = document.querySelector('.search-results');
const loadingSpinner = document.querySelector('.loading-spinner');

// State management
let cart = {
    items: [],
    total: 0
};
let user = null;
let restaurants = [];

// Initialize app
async function initializeApp() {
    try {
        // Try to authenticate with stored credentials
        const auth = await Pi.authenticate(['payments'], {
            onIncompletePaymentFound: handleIncompletePayment
        });
        
        if (auth) {
            user = auth.user;
            updateAuthUI();
            initializeSocket(auth.accessToken);
        }

        // Fetch initial data
        await Promise.all([
            fetchRestaurants(),
            loadCart()
        ]);

        // Add event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Error initializing app', 'error');
    }
}

// Socket.IO initialization
function initializeSocket(token) {
    socket = io('/', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('order:update', (order) => {
        updateOrderStatus(order);
    });

    socket.on('driver:location', (data) => {
        updateDriverLocation(data);
    });

    socket.on('error', (error) => {
        showToast(error.message, 'error');
    });
}

// Event Listeners
function setupEventListeners() {
    cartButton.addEventListener('click', toggleCart);
    closeCartButton.addEventListener('click', toggleCart);
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!cartSidebar.contains(e.target) && !cartButton.contains(e.target)) {
            cartSidebar.classList.add('translate-x-full');
        }
    });
}

// Cart Functions
function toggleCart() {
    cartSidebar.classList.toggle('translate-x-full');
}

function addToCart(item) {
    const existingItem = cart.items.find(i => i.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.items.push({ ...item, quantity: 1 });
    }
    
    updateCart();
    showToast('Item added to cart', 'success');
}

function removeFromCart(itemId) {
    cart.items = cart.items.filter(item => item.id !== itemId);
    updateCart();
    showToast('Item removed from cart', 'success');
}

function updateItemQuantity(itemId, quantity) {
    const item = cart.items.find(i => i.id === itemId);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = quantity;
            updateCart();
        }
    }
}

function updateCart() {
    // Update total
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update UI
    cartBadge.textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cartTotal.textContent = `π${cart.total.toFixed(2)}`;
    
    // Update cart items display
    cartItems.innerHTML = cart.items.map(item => `
        <div class="flex items-center justify-between p-4 border-b">
            <div class="flex items-center">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="ml-4">
                    <h4 class="font-bold">${item.name}</h4>
                    <p class="text-gray-500">π${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="updateItemQuantity(${item.id}, ${item.quantity - 1})" class="text-gray-500 hover:text-purple-600">
                    <i class="fas fa-minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button onclick="updateItemQuantity(${item.id}, ${item.quantity + 1})" class="text-gray-500 hover:text-purple-600">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Payment Functions
async function createPayment() {
    if (!user) {
        showToast('Please connect your Pi wallet first', 'error');
        return;
    }

    try {
        showLoading();
        const payment = await Pi.createPayment({
            amount: cart.total,
            memo: `Food Pi Hub Order - ${new Date().toISOString()}`,
            metadata: { cart: cart.items }
        });

        if (payment.status === 'completed') {
            // Create order in backend
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.accessToken}`
                },
                body: JSON.stringify({
                    items: cart.items,
                    total: cart.total,
                    paymentId: payment.identifier
                })
            });

            if (response.ok) {
                cart = { items: [], total: 0 };
                updateCart();
                showToast('Order placed successfully!', 'success');
                toggleCart();
            }
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Payment failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleIncompletePayment(payment) {
    try {
        showLoading();
        await Pi.completePayment(payment.identifier);
        showToast('Payment completed', 'success');
    } catch (error) {
        console.error('Complete payment error:', error);
        showToast('Failed to complete payment', 'error');
    } finally {
        hideLoading();
    }
}

// Search Functions
async function handleSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`/api/restaurants/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success) {
            displaySearchResults(data.restaurants);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displaySearchResults(results) {
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="p-4 text-gray-500">No results found</div>';
    } else {
        searchResults.innerHTML = results.map(restaurant => `
            <a href="/restaurant/${restaurant._id}" class="block p-4 hover:bg-gray-100">
                <div class="flex items-center">
                    <img src="${restaurant.image}" alt="${restaurant.name}" class="w-12 h-12 object-cover rounded-lg">
                    <div class="ml-4">
                        <h4 class="font-bold">${restaurant.name}</h4>
                        <p class="text-gray-500">${restaurant.cuisine.join(', ')}</p>
                    </div>
                </div>
            </a>
        `).join('');
    }
    
    searchResults.classList.remove('hidden');
}

// UI Helper Functions
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center space-x-2`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle text-green-500' : 'exclamation-circle text-red-500'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function updateAuthUI() {
    const authButton = document.querySelector('button[onclick="authenticate()"]');
    if (user) {
        authButton.innerHTML = `<i class="fas fa-user mr-2"></i>${user.username}`;
        authButton.classList.remove('bg-purple-600');
        authButton.classList.add('bg-green-600');
    }
}

// Utility Functions
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

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
