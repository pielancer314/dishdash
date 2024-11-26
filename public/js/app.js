// Pi Network SDK Integration
const Pi = window.Pi;
Pi.init({ version: "2.0" });

// UI Elements
const searchBtn = document.getElementById('search-btn');
const searchModal = document.getElementById('search-modal');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const walletConnectBtn = document.getElementById('wallet-connect');
const loadingSpinner = document.querySelector('.loading-spinner');

// Cart State
let cart = {
    items: [],
    total: 0
};

// UI Functions
function toggleSearchModal() {
    searchModal.classList.toggle('hidden');
}

function toggleCart() {
    cartSidebar.classList.toggle('translate-x-full');
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

// Cart Functions
function addToCart(item) {
    showLoading();
    cart.items.push(item);
    updateCartTotal();
    updateCartUI();
    hideLoading();
}

function removeFromCart(itemId) {
    showLoading();
    cart.items = cart.items.filter(item => item.id !== itemId);
    updateCartTotal();
    updateCartUI();
    hideLoading();
}

function updateCartTotal() {
    cart.total = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function updateCartUI() {
    const cartCount = document.querySelector('#cart-btn span');
    cartCount.textContent = cart.items.length;
    
    // Update cart sidebar items
    const cartItemsContainer = document.querySelector('#cart-sidebar .space-y-4');
    cartItemsContainer.innerHTML = cart.items.map(item => `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div class="ml-4">
                    <h4 class="font-bold">${item.name}</h4>
                    <p class="text-gray-500 text-sm">π${item.price.toFixed(2)}</p>
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

    // Update cart total
    const totalElement = document.querySelector('#cart-sidebar .font-bold span');
    totalElement.textContent = `π${cart.total.toFixed(2)}`;
}

// Pi Wallet Integration
async function connectWallet() {
    try {
        showLoading();
        const auth = await Pi.authenticate(['payments'], {
            onIncompletePaymentFound: handleIncompletePayment
        });
        
        if (auth) {
            walletConnectBtn.innerHTML = `<i class="fas fa-wallet mr-2"></i>${auth.user.username}`;
            walletConnectBtn.classList.remove('bg-purple-600');
            walletConnectBtn.classList.add('bg-green-600');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
    } finally {
        hideLoading();
    }
}

async function handleIncompletePayment(payment) {
    try {
        showLoading();
        await Pi.payments.complete(payment.identifier);
    } catch (error) {
        console.error('Error completing payment:', error);
    } finally {
        hideLoading();
    }
}

async function processPayment(amount) {
    try {
        showLoading();
        const payment = await Pi.createPayment({
            amount: amount,
            memo: "Food Pi Hub Food Order",
            metadata: { orderId: Date.now().toString() }
        });

        if (payment.status === 'completed') {
            cart = { items: [], total: 0 };
            updateCartUI();
            alert('Payment successful! Your order is being processed.');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('Payment failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// Event Listeners
searchBtn.addEventListener('click', toggleSearchModal);
cartBtn.addEventListener('click', toggleCart);
walletConnectBtn.addEventListener('click', connectWallet);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});
