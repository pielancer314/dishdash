// Initialize Pi SDK
const Pi = window.Pi;
Pi.init({ version: "2.0" });

// Mapbox configuration
mapboxgl.accessToken = 'your_mapbox_token';

// UI Elements
const statusToggle = document.getElementById('status-toggle');
const notificationsBtn = document.getElementById('notifications-btn');
const notificationsPanel = document.getElementById('notifications-panel');
const walletConnectBtn = document.getElementById('wallet-connect');
const deliveryPanel = document.getElementById('delivery-panel');
const loadingSpinner = document.querySelector('.loading-spinner');

// Driver state
let driverState = {
    isOnline: true,
    currentLocation: null,
    currentOrder: null,
    earnings: 0,
    deliveriesCompleted: 0
};

// Initialize map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-74.5, 40], // Default location
    zoom: 13
});

// Add driver location marker
const driverMarker = new mapboxgl.Marker({
    color: '#7C3AED', // Purple color
    draggable: false
});

// Add navigation control
map.addControl(new mapboxgl.NavigationControl());

// Initialize driver location tracking
function initializeLocationTracking() {
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                driverState.currentLocation = [longitude, latitude];
                updateDriverLocation();
            },
            error => {
                console.error('Error getting location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
}

// Update driver location on map
function updateDriverLocation() {
    if (driverState.currentLocation) {
        driverMarker.setLngLat(driverState.currentLocation).addTo(map);
        map.flyTo({
            center: driverState.currentLocation,
            zoom: 15
        });
    }
}

// Toggle driver status
function toggleStatus() {
    driverState.isOnline = !driverState.isOnline;
    statusToggle.classList.toggle('bg-green-500');
    statusToggle.classList.toggle('bg-gray-500');
    statusToggle.innerHTML = driverState.isOnline ? 
        '<i class="fas fa-circle text-xs mr-2"></i>Online' :
        '<i class="fas fa-circle text-xs mr-2"></i>Offline';
}

// Toggle notifications panel
function toggleNotifications() {
    const isHidden = notificationsPanel.classList.contains('scale-0');
    notificationsPanel.classList.toggle('scale-0');
    notificationsPanel.classList.toggle('opacity-0');
}

// Accept order
function acceptOrder(orderId) {
    showLoading();
    // Simulate API call
    setTimeout(() => {
        driverState.currentOrder = {
            id: orderId,
            status: 'accepted',
            pickup: [-74.5, 40.1],
            dropoff: [-74.48, 40.12]
        };
        showDeliveryPanel();
        updateMapRoute();
        hideLoading();
    }, 1000);
}

// Show delivery panel
function showDeliveryPanel() {
    deliveryPanel.classList.remove('translate-y-full');
}

// Hide delivery panel
function hideDeliveryPanel() {
    deliveryPanel.classList.add('translate-y-full');
}

// Update map route
async function updateMapRoute() {
    if (!driverState.currentOrder) return;

    const { pickup, dropoff } = driverState.currentOrder;
    
    try {
        // Get route from Mapbox Directions API
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup[0]},${pickup[1]};${dropoff[0]},${dropoff[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await query.json();
        
        const route = data.routes[0].geometry;

        // Add route to map
        if (map.getSource('route')) {
            map.getSource('route').setData({
                type: 'Feature',
                properties: {},
                geometry: route
            });
        } else {
            map.addLayer({
                id: 'route',
                type: 'line',
                source: {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: route
                    }
                },
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#7C3AED',
                    'line-width': 4,
                    'line-opacity': 0.75
                }
            });
        }

        // Fit map to show entire route
        const bounds = new mapboxgl.LngLatBounds();
        route.coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 50 });
    } catch (error) {
        console.error('Error getting route:', error);
    }
}

// Complete delivery
async function completeDelivery() {
    showLoading();
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        driverState.deliveriesCompleted++;
        driverState.earnings += parseFloat(driverState.currentOrder.amount);
        
        // Clear current order
        driverState.currentOrder = null;
        
        // Remove route from map
        if (map.getLayer('route')) {
            map.removeLayer('route');
            map.removeSource('route');
        }
        
        hideDeliveryPanel();
        showNotification('Delivery completed successfully!', 'success');
    } catch (error) {
        console.error('Error completing delivery:', error);
        showNotification('Failed to complete delivery', 'error');
    } finally {
        hideLoading();
    }
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
            showNotification('Wallet connected successfully!', 'success');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showNotification('Failed to connect wallet', 'error');
    } finally {
        hideLoading();
    }
}

// Handle incomplete payments
async function handleIncompletePayment(payment) {
    try {
        showLoading();
        await Pi.payments.complete(payment.identifier);
        showNotification('Incomplete payment resolved', 'success');
    } catch (error) {
        console.error('Error completing payment:', error);
        showNotification('Failed to resolve payment', 'error');
    } finally {
        hideLoading();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 transform transition-transform duration-300 translate-y-full`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-${type === 'success' ? 'check-circle text-green-500' : 
                          type === 'error' ? 'times-circle text-red-500' : 
                          'info-circle text-blue-500'}"></i>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.classList.remove('translate-y-full');
    });
    
    setTimeout(() => {
        notification.classList.add('translate-y-full');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// UI Helpers
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeLocationTracking();
    
    // Add event listeners
    statusToggle.addEventListener('click', toggleStatus);
    notificationsBtn.addEventListener('click', toggleNotifications);
    walletConnectBtn.addEventListener('click', connectWallet);
    
    // Close notifications panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationsBtn.contains(e.target) && !notificationsPanel.contains(e.target)) {
            notificationsPanel.classList.add('scale-0', 'opacity-0');
        }
    });
    
    // Add click handlers to order cards
    document.querySelectorAll('.border.rounded-lg').forEach(card => {
        const acceptBtn = card.querySelector('button');
        acceptBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const orderId = card.querySelector('h3').textContent.split('#')[1];
            acceptOrder(orderId);
        });
    });
});
