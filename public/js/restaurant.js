// Restaurant page functionality
let restaurant = null;
let menuItems = [];
let isVegOnly = false;
let sortOrder = 'default';

// Constants
const BASE_URL = window.location.hostname === 'localhost' ? '' : '/food-pi-hub';
const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://api.foodpihub.com/api';

// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// Cart functionality
const cartIcon = document.getElementById('cart-icon');
const cartDropdown = document.getElementById('cart-dropdown');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Toggle cart dropdown with animation
cartIcon.addEventListener('click', () => {
    cartDropdown.classList.toggle('hidden');
    if (!cartDropdown.classList.contains('hidden')) {
        setTimeout(() => cartDropdown.classList.add('opacity-100'), 10);
    } else {
        cartDropdown.classList.remove('opacity-100');
    }
});

// Close cart when clicking outside
document.addEventListener('click', (e) => {
    if (!cartIcon.contains(e.target)) {
        cartDropdown.classList.add('hidden');
        cartDropdown.classList.remove('opacity-100');
    }
});

// Load restaurant data with enhanced error handling
async function loadRestaurantData() {
    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');

    try {
        const response = await fetch(`${API_URL}/restaurants/${restaurantId}`);
        if (!response.ok) throw new Error('Restaurant not found');
        
        restaurant = await response.json();
        
        // Update UI with restaurant data and animations
        const nameElement = document.getElementById('restaurant-name');
        const coverElement = document.getElementById('restaurant-cover');
        const ratingElement = document.getElementById('restaurant-rating');
        const reviewElement = document.getElementById('review-count');
        const cuisineElement = document.getElementById('cuisine-type');
        const timeElement = document.getElementById('delivery-time');

        // Fade in animations
        [nameElement, ratingElement, reviewElement, cuisineElement, timeElement].forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
        });

        // Update content
        nameElement.textContent = restaurant.name;
        coverElement.src = `${BASE_URL}${restaurant.coverImage}`;
        ratingElement.innerHTML = generateStarRating(restaurant.rating);
        reviewElement.textContent = `(${restaurant.reviewCount} reviews)`;
        cuisineElement.textContent = restaurant.cuisineType;
        timeElement.textContent = `${restaurant.deliveryTime} min`;

        // Trigger animations
        setTimeout(() => {
            [nameElement, ratingElement, reviewElement, cuisineElement, timeElement].forEach((el, i) => {
                setTimeout(() => {
                    el.style.transition = 'all 0.5s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, i * 100);
            });
        }, 300);

        // Load menu items
        await loadMenuItems(restaurantId);
    } catch (error) {
        console.error('Error loading restaurant:', error);
        showErrorMessage('Could not load restaurant details. Please try again later.');
    }
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
        ${`<i class="fas fa-star text-yellow-400"></i>`.repeat(fullStars)}
        ${hasHalfStar ? `<i class="fas fa-star-half-alt text-yellow-400"></i>` : ''}
        ${`<i class="far fa-star text-yellow-400"></i>`.repeat(emptyStars)}
        <span class="ml-2">${rating.toFixed(1)}</span>
    `;
}

// Load menu items with categories
async function loadMenuItems(restaurantId) {
    try {
        const response = await fetch(`${API_URL}/restaurants/${restaurantId}/menu`);
        if (!response.ok) throw new Error('Menu not found');
        
        menuItems = await response.json();
        filterAndRenderMenu();
    } catch (error) {
        console.error('Error loading menu items:', error);
        showErrorMessage('Could not load menu items. Please try again later.');
    }
}

// Filter and render menu based on current filters
function filterAndRenderMenu() {
    let filteredItems = [...menuItems];

    // Apply veg filter
    if (isVegOnly) {
        filteredItems = filteredItems.filter(item => item.isVeg);
    }

    // Apply sort
    if (sortOrder === 'price-asc') {
        filteredItems.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
        filteredItems.sort((a, b) => b.price - a.price);
    }

    // Group and render
    const categories = groupByCategory(filteredItems);
    renderMenuCategories(categories);
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

// Render menu categories with enhanced UI
function renderMenuCategories(categories) {
    const container = document.getElementById('menu-categories');
    container.innerHTML = '';

    Object.entries(categories).forEach(([category, items]) => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'menu-category';
        categoryElement.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 flex items-center">
                <span class="mr-3">${category}</span>
                <span class="text-sm font-normal text-gray-500">${items.length} items</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${items.map(item => `
                    <div class="menu-item bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div class="relative">
                            <img src="${BASE_URL}${item.image}" alt="${item.name}" class="w-full h-48 object-cover">
                            ${item.isVeg ? `
                                <span class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                                    <i class="fas fa-leaf mr-1"></i>Veg
                                </span>
                            ` : ''}
                        </div>
                        <div class="p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-lg">${item.name}</h3>
                                <span class="pill-badge">π${item.price.toFixed(2)}</span>
                            </div>
                            <p class="text-gray-600 text-sm mb-4">${item.description}</p>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    ${item.spicyLevel ? `
                                        <div class="flex items-center text-orange-500">
                                            ${'🌶️'.repeat(item.spicyLevel)}
                                        </div>
                                    ` : ''}
                                </div>
                                <button 
                                    onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                                    class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center"
                                >
                                    <i class="fas fa-plus mr-2"></i>
                                    Add
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

// Enhanced cart functionality
function addToCart(item) {
    const existingItem = cart.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`Added ${item.name} to cart`);
}

function removeFromCart(index) {
    const item = cart[index];
    if (item.quantity > 1) {
        item.quantity--;
    } else {
        cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showToast(`Removed ${item.name} from cart`);
}

// Update cart UI with enhanced display
function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    // Update cart count with animation
    cartCount.classList.add('scale-125');
    setTimeout(() => cartCount.classList.remove('scale-125'), 200);
    cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Update cart items
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
            <div class="flex items-center space-x-4">
                <img src="${BASE_URL}${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div>
                    <h4 class="font-medium">${item.name}</h4>
                    <p class="text-sm text-gray-600">π${item.price.toFixed(2)} × ${item.quantity || 1}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button 
                    onclick="removeFromCart(${index})"
                    class="p-1 hover:bg-red-100 rounded-full text-red-600 transition-colors duration-200"
                >
                    <i class="fas fa-minus"></i>
                </button>
                <span class="font-medium">${item.quantity || 1}</span>
                <button 
                    onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})"
                    class="p-1 hover:bg-purple-100 rounded-full text-purple-600 transition-colors duration-200"
                >
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Update total with animation
    const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    cartTotal.textContent = `π${total.toFixed(2)}`;
}

// Search functionality with debounce
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

// Filter and sort handlers
document.querySelector('button:contains("Veg Only")').addEventListener('click', function() {
    this.classList.toggle('border-purple-500');
    this.classList.toggle('bg-purple-50');
    isVegOnly = !isVegOnly;
    filterAndRenderMenu();
});

document.querySelector('button:contains("Sort by Price")').addEventListener('click', function() {
    this.classList.toggle('border-purple-500');
    this.classList.toggle('bg-purple-50');
    sortOrder = sortOrder === 'default' ? 'price-asc' : 
                sortOrder === 'price-asc' ? 'price-desc' : 'default';
    filterAndRenderMenu();
});

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-full opacity-0 transition-all duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
    }, 100);

    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Error message display
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
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
