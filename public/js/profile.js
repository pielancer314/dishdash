// Pi Network SDK initialization
const Pi = window.Pi;
Pi.init({ version: "2.0" });

class UserProfile {
    constructor() {
        this.initializeEventListeners();
        this.loadProfileData();
        this.initializeWallet();
    }

    initializeEventListeners() {
        // Profile form submission
        const profileForm = document.querySelector('#profile-info form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Wallet connect button
        const walletConnectBtn = document.getElementById('wallet-connect');
        if (walletConnectBtn) {
            walletConnectBtn.addEventListener('click', () => this.connectWallet());
        }

        // Navigation links
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.closest('a').getAttribute('href').replace('#', ''));
            });
        });

        // Order detail buttons
        document.querySelectorAll('button:contains("View Details")').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.closest('.border').querySelector('h3').textContent.split('#')[1];
                this.viewOrderDetails(orderId);
            });
        });

        // Top up button
        const topUpBtn = document.querySelector('button:contains("Top Up")');
        if (topUpBtn) {
            topUpBtn.addEventListener('click', () => this.handleTopUp());
        }
    }

    async loadProfileData() {
        try {
            // Mock API call - Replace with actual endpoint
            const profileData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '+1 234 567 8900',
                memberSince: '2023',
                orders: [
                    {
                        id: '12345',
                        restaurant: 'Pizza Paradise',
                        amount: 'π25.99',
                        status: 'delivered',
                        date: 'March 15, 2024'
                    },
                    {
                        id: '12344',
                        restaurant: 'Burger Bliss',
                        amount: 'π18.50',
                        status: 'in-progress',
                        date: 'March 14, 2024'
                    }
                ],
                wallet: {
                    balance: 'π1,234.56',
                    totalSpent: 'π789.00',
                    rewards: 'π23.45',
                    transactions: [
                        {
                            type: 'payment',
                            description: 'Payment to Pizza Paradise',
                            amount: '-π25.99',
                            date: 'March 15, 2024'
                        },
                        {
                            type: 'topup',
                            description: 'Wallet Top Up',
                            amount: '+π100.00',
                            date: 'March 13, 2024'
                        }
                    ]
                }
            };

            this.updateUI(profileData);
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showError('Failed to load profile data');
        }
    }

    async initializeWallet() {
        try {
            const auth = await Pi.authenticate(['payments'], this.onIncompletePaymentFound);
            const user = auth.user;
            
            // Update UI to show connected wallet
            const walletConnectBtn = document.getElementById('wallet-connect');
            if (walletConnectBtn) {
                walletConnectBtn.innerHTML = `
                    <i class="fas fa-wallet mr-2"></i>
                    Connected: ${user.username}
                `;
                walletConnectBtn.classList.add('bg-green-600');
            }
        } catch (error) {
            console.error('Pi wallet initialization error:', error);
            this.showError('Failed to initialize Pi wallet');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            };

            // Mock API call - Replace with actual endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showSuccess('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile');
        }
    }

    async connectWallet() {
        try {
            await this.initializeWallet();
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showError('Failed to connect Pi wallet');
        }
    }

    handleNavigation(section) {
        // Smooth scroll to section
        const element = document.getElementById(`${section}-info`) || 
                       document.getElementById(`${section}-history`) || 
                       document.getElementById(`${section}-wallet`);
        
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async viewOrderDetails(orderId) {
        try {
            // Mock API call - Replace with actual endpoint
            const orderDetails = {
                id: orderId,
                items: [
                    { name: 'Margherita Pizza', quantity: 1, price: 'π15.99' },
                    { name: 'Garlic Bread', quantity: 2, price: 'π5.00' }
                ],
                total: 'π25.99',
                status: 'delivered',
                deliveryAddress: '123 Main St, City, Country'
            };

            // Show order details in a modal
            this.showOrderDetailsModal(orderDetails);
        } catch (error) {
            console.error('Error fetching order details:', error);
            this.showError('Failed to load order details');
        }
    }

    async handleTopUp() {
        try {
            const payment = {
                amount: 100, // Pi coins
                memo: 'Food Pi Hub Wallet Top Up',
                metadata: { type: 'wallet_topup' }
            };

            const paymentData = await Pi.createPayment(payment);
            
            // Handle the payment completion
            this.showSuccess('Wallet topped up successfully');
            this.loadProfileData(); // Refresh wallet data
        } catch (error) {
            console.error('Error topping up wallet:', error);
            this.showError('Failed to top up wallet');
        }
    }

    updateUI(data) {
        // Update profile information
        document.querySelector('input[name="firstName"]').value = data.firstName;
        document.querySelector('input[name="lastName"]').value = data.lastName;
        document.querySelector('input[name="email"]').value = data.email;
        document.querySelector('input[name="phone"]').value = data.phone;

        // Update wallet information
        document.querySelector('#pi-wallet .text-3xl').textContent = data.wallet.balance;
        document.querySelector('#pi-wallet .grid-cols-2 div:first-child p:last-child').textContent = data.wallet.totalSpent;
        document.querySelector('#pi-wallet .grid-cols-2 div:last-child p:last-child').textContent = data.wallet.rewards;
    }

    showOrderDetailsModal(details) {
        // Implementation for showing order details modal
        console.log('Order details:', details);
    }

    showSuccess(message) {
        // Implementation for success toast notification
        console.log('Success:', message);
    }

    showError(message) {
        // Implementation for error toast notification
        console.error('Error:', message);
    }

    onIncompletePaymentFound(payment) {
        // Handle incomplete payment
        console.log('Incomplete payment found:', payment);
    }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const profile = new UserProfile();
});
