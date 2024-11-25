// Restaurant page functionality
let restaurant = null;
let menuItems = [];

// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// Cart functionality
const cartIcon = document.getElementById('cart-icon');
const cartDropdown = document.getElementById('cart-dropdown');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Toggle cart dropdown
cartIcon.addEventListener('click', () => {
    cartDropdown.classList.toggle('hidden');
});

// Close cart when clicking outside
document.addEventListener('click', (e) => {
    if (!cartIcon.contains(e.target)) {
        cartDropdown.classList.add('hidden');
    }
});

// Load restaurant data
async function loadRestaurantData() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');

    try {
        const response = await fetch(`/api/restaurants/${restaurantId}`);
        restaurant = await response.json();
        
        // Update UI with restaurant data
        document.getElementById('restaurant-name').textContent = restaurant.name;
        document.getElementById('restaurant-cover').src = restaurant.coverImage;
        document.getElementById('restaurant-rating').textContent = '★'.repeat(Math.floor(restaurant.rating));
        document.getElementById('review-count').textContent = `(${restaurant.reviewCount} reviews)`;
        document.getElementById('cuisine-type').textContent = restaurant.cuisineType;
        document.getElementById('delivery-time').textContent = `${restaurant.deliveryTime} min`;

        // Load menu items
        await loadMenuItems(restaurantId);
    } catch (error) {
        console.error('Error loading restaurant:', error);
    }
}

// Load menu items
async function loadMenuItems(restaurantId) {
    try {
        const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
        menuItems = await response.json();
        
        // Group items by category
        const categories = groupByCategory(menuItems);
        renderMenuCategories(categories);
    } catch (error) {
        console.error('Error loading menu items:', error);
    }
}

// Group menu items by category
function groupByCategory(items) {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});
}

// Render menu categories
function renderMenuCategories(categories) {
    const container = document.getElementById('menu-categories');
    container.innerHTML = '';

    Object.entries(categories).forEach(([category, items]) => {
        const categoryElement = document.createElement('div');
        categoryElement.innerHTML = `
            <h2 class="text-xl font-bold mb-4">${category}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${items.map(item => `
                    <div class="flex items-center space-x-4 p-4 border rounded-lg">
                        <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
                        <div class="flex-1">
                            <h3 class="font-bold">${item.name}</h3>
                            <p class="text-gray-600 text-sm">${item.description}</p>
                            <div class="flex items-center justify-between mt-2">
                                <span class="font-bold">π${item.price.toFixed(2)}</span>
                                <button 
                                    onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                                    class="px-4 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(categoryElement);
    });
}

// Add item to cart
function addToCart(item) {
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count
    cartCount.textContent = cart.length;

    // Update cart items
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="flex items-center justify-between">
            <div>
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-sm text-gray-600">π${item.price.toFixed(2)}</p>
            </div>
            <button 
                onclick="removeFromCart(${index})"
                class="text-red-600 hover:text-red-800"
            >
                Remove
            </button>
        </div>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `π${total.toFixed(2)}`;
}

// Search functionality
const searchInput = document.querySelector('input[type="text"]');
searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
    );
    
    const categories = groupByCategory(filteredItems);
    renderMenuCategories(categories);
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

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadRestaurantData();
    updateCartUI();
});
