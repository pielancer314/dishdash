// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0", sandbox: true });

// Get cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Constants
const DELIVERY_FEE = 2.00;
const SERVICE_FEE = 1.00;

// DOM Elements
const orderItemsContainer = document.getElementById('order-items');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const piAmountElement = document.getElementById('pi-amount');
const payWithPiButton = document.getElementById('pay-with-pi');
const confirmationModal = document.getElementById('confirmation-modal');
const addressForm = document.getElementById('address-form');

// Initialize checkout page
function initializeCheckout() {
    renderOrderItems();
    updateTotals();
    setupPaymentButton();
}

// Render order items
function renderOrderItems() {
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p class="text-gray-600">Your cart is empty</p>';
        return;
    }

    orderItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="flex items-center justify-between border-b pb-4">
            <div class="flex items-center space-x-4">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                <div>
                    <h3 class="font-medium">${item.name}</h3>
                    <p class="text-gray-600 text-sm">${item.description}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-medium">π${item.price.toFixed(2)}</p>
                <button 
                    onclick="removeItem(${index})"
                    class="text-sm text-red-600 hover:text-red-800"
                >
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

// Remove item from cart
function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderOrderItems();
    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + DELIVERY_FEE + SERVICE_FEE;

    subtotalElement.textContent = `π${subtotal.toFixed(2)}`;
    totalElement.textContent = `π${total.toFixed(2)}`;
    piAmountElement.textContent = `(π${total.toFixed(2)})`;

    // Disable payment button if cart is empty
    payWithPiButton.disabled = cart.length === 0;
    if (cart.length === 0) {
        payWithPiButton.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        payWithPiButton.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Setup payment button
function setupPaymentButton() {
    payWithPiButton.addEventListener('click', async () => {
        if (!validateForm()) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const payment = await createPayment();
            if (payment.status === 'completed') {
                await submitOrder(payment);
                showConfirmation();
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        }
    });
}

// Validate form
function validateForm() {
    return addressForm.checkValidity();
}

// Create Pi payment
async function createPayment() {
    const total = cart.reduce((sum, item) => sum + item.price, 0) + DELIVERY_FEE + SERVICE_FEE;
    
    try {
        // Authenticate user
        const scopes = ['payments'];
        const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);

        // Create payment
        const payment = await Pi.createPayment({
            amount: total.toFixed(2),
            memo: `DishDash Order - ${new Date().toISOString()}`,
            metadata: { cart },
        });

        return payment;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw error;
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

// Submit order to backend
async function submitOrder(payment) {
    const formData = new FormData(addressForm);
    const address = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: cart,
                address,
                payment: {
                    id: payment.identifier,
                    amount: payment.amount,
                    status: payment.status,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit order');
        }

        // Clear cart after successful order
        cart = [];
        localStorage.removeItem('cart');
    } catch (error) {
        console.error('Error submitting order:', error);
        throw error;
    }
}

// Show confirmation modal
function showConfirmation() {
    confirmationModal.classList.remove('hidden');
    setTimeout(() => {
        window.location.href = '/';
    }, 5000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', initializeCheckout);
