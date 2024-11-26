document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.search-bar input');
    const categoryCards = document.querySelectorAll('.category-card');
    const loginButton = document.querySelector('a[href="#"]:contains("Login")');
    const signUpButton = document.querySelector('button:contains("Sign Up")');

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // TODO: Implement search logic to filter restaurants and dishes
        console.log('Searching for:', searchTerm);
    });

    // Category card interactions
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.querySelector('span').textContent;
            // TODO: Implement category filtering
            console.log('Selected category:', category);
        });
    });

    // Authentication handlers
    const handleLogin = () => {
        // TODO: Implement Pi Network authentication
        console.log('Login clicked');
    };

    const handleSignUp = () => {
        // TODO: Implement Pi Network sign up
        console.log('Sign up clicked');
    };

    // Pi Network Integration
    const initPiNetwork = async () => {
        try {
            // Initialize Pi Network SDK
            const scopes = ['payments'];
            const Pi = window.Pi;
            
            if (Pi) {
                Pi.init({ version: "2.0", sandbox: true });
                await Pi.authenticate(scopes, onIncompletePaymentFound);
                console.log('Pi Network SDK initialized');
            }
        } catch (error) {
            console.error('Error initializing Pi Network:', error);
        }
    };

    const onIncompletePaymentFound = (payment) => {
        // Handle incomplete payment
        console.log('Incomplete payment found:', payment);
    };

    // Restaurant rating system
    const initRatingSystem = () => {
        const ratingElements = document.querySelectorAll('.restaurant-card .text-yellow-500');
        ratingElements.forEach(element => {
            const rating = parseFloat(element.nextElementSibling.textContent);
            element.textContent = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        });
    };

    // Mobile responsiveness enhancements
    const handleResponsiveMenu = () => {
        const menuButton = document.querySelector('.mobile-menu-button');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    };

    // Initialize all functionality
    initPiNetwork();
    initRatingSystem();
    handleResponsiveMenu();

    // Event listeners for auth buttons
    document.querySelector('a:contains("Login")').addEventListener('click', handleLogin);
    document.querySelector('button:contains("Sign Up")').addEventListener('click', handleSignUp);
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PI'
    }).format(amount);
}
