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
const connectWalletBtn = document.querySelector('button[onclick="authenticate()"]');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    setupSearchBar();
    setupCategoryCards();
    setupRestaurantCards();
    checkAuthentication();
});

cartButton.addEventListener('click', toggleCart);
closeCartButton.addEventListener('click', toggleCart);

// Authentication state check
function checkAuthentication() {
    if (currentUser) {
        connectWalletBtn.innerHTML = `
            <i class="fas fa-wallet mr-2"></i>
            ${currentUser.username}
        `;
        connectWalletBtn.classList.add('bg-green-600');
    }
}

// Cart Functions
function toggleCart() {
    cartSidebar.classList.toggle('translate-x-full');
    updateCartUI();
}

function updateCartUI() {
    cartBadge.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                <i class="fas fa-shopping-cart text-4xl mb-4"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            cartItemsContainer.innerHTML += `
                <div class="flex items-center justify-between mb-4 p-2 border-b cart-item">
                    <div>
                        <h4 class="font-bold">${item.name}</h4>
                        <p class="text-gray-600">π${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="updateQuantity(${index}, -1)" class="text-purple-600 hover:text-purple-800 p-1">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="w-8 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="text-purple-600 hover:text-purple-800 p-1">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button onclick="removeFromCart(${index})" class="text-red-600 hover:text-red-800 ml-2 p-1">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    cartTotal.textContent = `π${total.toFixed(2)}`;
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(item) {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
        showToast('Item quantity updated');
    } else {
        cart.push({ ...item, quantity: 1 });
        showToast('Item added to cart');
    }
    updateCartUI();
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        updateCartUI();
        showToast('Cart updated');
    }
}

function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    updateCartUI();
    showToast(`Removed ${item.name} from cart`);
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
            showLoading();
            const results = await mockSearchAPI(query);
            displaySearchResults(results, searchResults);
        } catch (error) {
            console.error('Search error:', error);
            showToast('Search failed. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }, 300));

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.classList.add('hidden');
        }
    });
}

function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-gray-500 text-center">
                <p>No results found</p>
            </div>
        `;
    } else {
        container.innerHTML = results.map(result => `
            <div class="p-4 hover:bg-gray-50 cursor-pointer" onclick="handleSearchResult(${JSON.stringify(result).replace(/"/g, '&quot;')})">
                <div class="flex items-center">
                    <div class="flex-1">
                        <h4 class="font-bold">${result.name}</h4>
                        <p class="text-gray-600">${result.description}</p>
                    </div>
                    <div class="text-purple-600">
                        π${result.price.toFixed(2)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    container.classList.remove('hidden');
}

function handleSearchResult(result) {
    addToCart({
        id: result.id,
        name: result.name,
        price: result.price
    });
    document.querySelector('.search-bar input').value = '';
    document.querySelector('.search-results').classList.add('hidden');
}

// Pi Network Authentication
async function authenticate() {
    if (isAuthenticated) {
        showToast('Already connected to Pi Network');
        return;
    }

    try {
        showLoading();
        const scopes = ['payments'];
        const authResponse = await Pi.authenticate(scopes, onIncompletePaymentFound);
        
        if (authResponse) {
            currentUser = authResponse.user;
            isAuthenticated = true;
            checkAuthentication();
            showToast('Successfully connected to Pi Network');
            // TODO: Send auth data to backend
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showToast('Failed to connect to Pi Network', 'error');
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
            memo: `DishDash order - ${cart.length} items`,
            metadata: { 
                orderId: generateOrderId(),
                items: cart,
                timestamp: new Date().toISOString()
            },
        };

        const paymentResponse = await Pi.createPayment(payment);
        
        if (paymentResponse.status === 'completed') {
            cart = [];
            updateCartUI();
            showToast('Payment successful! Your order is being processed.');
            toggleCart();
        } else {
            showToast('Payment incomplete. Please try again.', 'warning');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Payment failed. Please try again later.', 'error');
    } finally {
        hideLoading();
    }
}

function onIncompletePaymentFound(payment) {
    console.log('Incomplete payment found:', payment);
    showToast('Found an incomplete payment. Please complete it first.', 'warning');
}

// UI Helpers
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'} mr-2"></i>
            <p>${message}</p>
        </div>
    `;
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

function generateOrderId() {
    return 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Mock API Functions (Replace with actual API calls)
async function mockSearchAPI(query) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = [
        { id: 1, name: 'Margherita Pizza', description: 'Fresh tomatoes, mozzarella, basil', price: 12.99 },
        { id: 2, name: 'Pepperoni Pizza', description: 'Pepperoni, cheese, tomato sauce', price: 14.99 },
        { id: 3, name: 'Vegetarian Pizza', description: 'Mixed vegetables, cheese', price: 13.99 },
        { id: 4, name: 'Cheeseburger', description: 'Beef patty, cheese, lettuce, tomato', price: 9.99 },
        { id: 5, name: 'Chicken Wings', description: 'Spicy buffalo wings', price: 8.99 }
    ];
    
    return mockData.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
    );
}

// Initialize category and restaurant cards
function setupCategoryCards() {
    const categories = document.querySelectorAll('.category-card');
    categories.forEach(card => {
        card.addEventListener('click', () => {
            const categoryName = card.querySelector('span').textContent;
            showToast(`Browsing ${categoryName} category`);
            // TODO: Implement category filtering
        });
    });
}

function setupRestaurantCards() {
    const restaurants = document.querySelectorAll('.restaurant-card');
    restaurants.forEach(card => {
        card.addEventListener('click', () => {
            const restaurantName = card.querySelector('h3').textContent;
            showToast(`Viewing ${restaurantName}`);
            // TODO: Implement restaurant details view
        });
    });
}
