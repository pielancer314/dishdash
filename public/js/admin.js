// Pi Network SDK initialization
const Pi = window.Pi;
Pi.init({ version: "2.0" });

// Admin Dashboard functionality
class AdminDashboard {
    constructor() {
        this.initializeEventListeners();
        this.loadDashboardData();
    }

    initializeEventListeners() {
        // Add Restaurant button
        const addRestaurantBtn = document.querySelector('button:contains("Add Restaurant")');
        if (addRestaurantBtn) {
            addRestaurantBtn.addEventListener('click', () => this.showAddRestaurantModal());
        }

        // Navigation links
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.closest('a').getAttribute('href').replace('#', ''));
            });
        });
    }

    async loadDashboardData() {
        try {
            // Mock data loading - Replace with actual API calls
            await Promise.all([
                this.loadStats(),
                this.loadRecentOrders(),
                this.loadRestaurantPerformance()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async loadStats() {
        // Mock API call - Replace with actual endpoint
        const stats = {
            orders: 1234,
            revenue: 15678,
            users: 892,
            restaurants: 45
        };

        // Update UI with stats
        this.updateStats(stats);
    }

    async loadRecentOrders() {
        // Mock API call - Replace with actual endpoint
        const orders = [
            {
                id: '#12345',
                customer: 'John Doe',
                restaurant: 'Pizza Paradise',
                amount: 'π25.99',
                status: 'completed'
            },
            {
                id: '#12344',
                customer: 'Jane Smith',
                restaurant: 'Burger Bliss',
                amount: 'π18.50',
                status: 'pending'
            }
        ];

        // Update UI with orders
        this.updateOrdersTable(orders);
    }

    async loadRestaurantPerformance() {
        // Mock API call - Replace with actual endpoint
        const restaurants = [
            {
                name: 'Pizza Paradise',
                image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
                orders: 458,
                revenue: 'π5,890',
                rating: 4.8,
                status: 'active'
            },
            {
                name: 'Burger Bliss',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
                orders: 356,
                revenue: 'π4,230',
                rating: 4.6,
                status: 'active'
            }
        ];

        // Update UI with restaurant performance
        this.updateRestaurantTable(restaurants);
    }

    updateStats(stats) {
        // Update statistics cards
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                element.textContent = this.formatNumber(value);
            }
        });
    }

    updateOrdersTable(orders) {
        const tbody = document.querySelector('#recent-orders tbody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(order => `
            <tr class="border-b">
                <td class="py-4">${order.id}</td>
                <td class="py-4">${order.customer}</td>
                <td class="py-4">${order.restaurant}</td>
                <td class="py-4">${order.amount}</td>
                <td class="py-4">
                    <span class="px-2 py-1 bg-${order.status === 'completed' ? 'green' : 'yellow'}-100 
                                text-${order.status === 'completed' ? 'green' : 'yellow'}-800 
                                rounded-full text-sm">
                        ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </td>
                <td class="py-4">
                    <button class="text-purple-600 hover:text-purple-800">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateRestaurantTable(restaurants) {
        const tbody = document.querySelector('#restaurant-performance tbody');
        if (!tbody) return;

        tbody.innerHTML = restaurants.map(restaurant => `
            <tr class="border-b">
                <td class="py-4">
                    <div class="flex items-center">
                        <img src="${restaurant.image}" 
                             alt="${restaurant.name}" 
                             class="w-10 h-10 rounded-lg object-cover mr-3">
                        <span>${restaurant.name}</span>
                    </div>
                </td>
                <td class="py-4">${restaurant.orders}</td>
                <td class="py-4">${restaurant.revenue}</td>
                <td class="py-4">
                    <div class="flex items-center">
                        <i class="fas fa-star text-yellow-400"></i>
                        <span class="ml-1">${restaurant.rating}</span>
                    </div>
                </td>
                <td class="py-4">
                    <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        ${restaurant.status.charAt(0).toUpperCase() + restaurant.status.slice(1)}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    showAddRestaurantModal() {
        // Implementation for adding new restaurant
        console.log('Add restaurant modal');
    }

    handleNavigation(section) {
        // Implementation for navigation
        console.log('Navigate to:', section);
    }

    formatNumber(number) {
        return new Intl.NumberFormat().format(number);
    }

    showError(message) {
        // Implementation for error handling
        console.error(message);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AdminDashboard();
});

// Pi Wallet integration
class PiWallet {
    static async authenticate() {
        try {
            const scopes = ['payments'];
            const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
            return auth;
        } catch (error) {
            console.error('Pi authentication error:', error);
            throw error;
        }
    }

    static async onIncompletePaymentFound(payment) {
        // Handle incomplete payment
        console.log('Incomplete payment found:', payment);
    }
}

// Export for use in other modules
window.AdminDashboard = AdminDashboard;
window.PiWallet = PiWallet;
