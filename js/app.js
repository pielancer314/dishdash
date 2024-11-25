// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// App state
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isAuthenticated = false;
let currentUser = null;

// DOM Elements
const cartButton = document.getElementById('cart-button');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartButton = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const cartBadge = document.getElementById('cart-badge');
const loadingSpinner = document.querySelector('.loading-spinner');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    setupSearchBar();
    setupCategoryCards();
    setupRestaurantCards();
});

cartButton.addEventListener('click', toggleCart);
closeCartButton.addEventListener('click', toggleCart);

// Cart Functions
function toggleCart() {
    cartSidebar.classList.toggle('translate-x-full');
    updateCartUI();
}

function updateCartUI() {
    cartBadge.textContent = cart.length;
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        cartItemsContainer.innerHTML += `
            <div class="flex items-center justify-between mb-4 p-2 border-b">
                <div>
                    <h4 class="font-bold">${item.name}</h4>
                    <p class="text-gray-600">π${item.price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="updateQuantity(${index}, -1)" class="text-purple-600 hover:text-purple-800">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="text-purple-600 hover:text-purple-800">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button onclick="removeFromCart(${index})" class="text-red-600 hover:text-red-800 ml-2">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartTotal.textContent = `π${total.toFixed(2)}`;
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(item) {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
    showToast('Item added to cart');
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    showToast('Item removed from cart');
}

// Search Functions
function setupSearchBar() {
    const searchInput = document.querySelector('.search-bar input');
    const searchResults = document.querySelector('.search-results');

    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        try {
            // TODO: Replace with actual API call
            const results = await mockSearchAPI(query);
            displaySearchResults(results, searchResults);
        } catch (error) {
            console.error('Search error:', error);
        }
    }, 300));

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
}

function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.innerHTML = results.map(result => `
        <div class="p-4 hover:bg-gray-50 cursor-pointer">
            <h4 class="font-bold">${result.name}</h4>
            <p class="text-gray-600">${result.description}</p>
        </div>
    `).join('');
    
    container.classList.remove('hidden');
}

// Pi Network Authentication
async function authenticate() {
    try {
        showLoading();
        const scopes = ['payments'];
        const authResponse = await Pi.authenticate(scopes, onIncompletePaymentFound);
        
        if (authResponse) {
            currentUser = authResponse.user;
            isAuthenticated = true;
            showToast('Successfully authenticated with Pi Network');
            // TODO: Send auth data to backend
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showToast('Authentication failed', 'error');
    } finally {
        hideLoading();
    }
}

// Pi Network Payments
async function createPayment() {
    if (!isAuthenticated) {
        showToast('Please connect your Pi wallet first', 'warning');
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }

    try {
        showLoading();
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        const payment = {
            amount: total,
            memo: "Food order payment",
            metadata: { cart },
        };

        const paymentResponse = await Pi.createPayment(payment);
        
        if (paymentResponse.status === 'completed') {
            cart = [];
            updateCartUI();
            showToast('Payment successful!');
            toggleCart();
        } else {
            showToast('Payment incomplete', 'warning');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Payment failed', 'error');
    } finally {
        hideLoading();
    }
}

function onIncompletePaymentFound(payment) {
    console.log('Incomplete payment found:', payment);
    // TODO: Handle incomplete payment
}

// UI Helpers
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-yellow-500'
    } text-white z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
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

// Mock API Functions (Replace with actual API calls)
async function mockSearchAPI(query) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        { name: 'Pizza Paradise', description: 'Italian • Pizza • Pasta' },
        { name: 'Burger Bliss', description: 'American • Burgers • Fries' },
        { name: 'Sushi Supreme', description: 'Japanese • Sushi • Ramen' }
    ].filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    );
}

// Initialize category and restaurant cards
function setupCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            // TODO: Handle category selection
            showToast('Category selected: ' + card.querySelector('span').textContent);
        });
    });
}

function setupRestaurantCards() {
    const restaurantCards = document.querySelectorAll('.restaurant-card');
    restaurantCards.forEach(card => {
        card.addEventListener('click', () => {
            // TODO: Navigate to restaurant detail page
            showToast('Opening restaurant: ' + card.querySelector('h3').textContent);
        });
    });
}
