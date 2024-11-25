import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Icon,
  Divider,
} from 'react-native-elements';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MultiCryptoPayment } from '../components/payment/MultiCryptoPayment';

const CartScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [cartItems, setCartItems] = useState([]);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (route.params?.cart) {
      // Group identical items and add quantity
      const groupedCart = route.params.cart.reduce((acc, item) => {
        const existingItem = acc.find(i => i.id === item.id);
        if (existingItem) {
          existingItem.quantity += 1;
          return acc;
        }
        return [...acc, { ...item, quantity: 1 }];
      }, []);
      setCartItems(groupedCart);
    }
  }, [route.params?.cart]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.99;
  const serviceFee = 1.99;
  const total = subtotal + deliveryFee + serviceFee;

  const updateQuantity = (itemId, change) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const handleCheckout = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transaction) => {
    Alert.alert(
      'Order Placed!',
      'Your order has been successfully placed. You can track it in the Orders tab.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Orders');
          },
        },
      ]
    );
  };

  const handlePaymentError = (error) => {
    Alert.alert('Payment Failed', error.message);
  };

  const renderCartItem = (item) => (
    <View key={item.id} style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, -1)}
          style={styles.quantityButton}
        >
          <Icon name="remove" type="material" size={20} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          onPress={() => updateQuantity(item.id, 1)}
          style={styles.quantityButton}
        >
          <Icon name="add" type="material" size={20} color="#6B46C1" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.cartItems}>
          {cartItems.length > 0 ? (
            cartItems.map(renderCartItem)
          ) : (
            <Text style={styles.emptyCart}>Your cart is empty</Text>
          )}
        </View>
        {cartItems.length > 0 && (
          <View style={styles.summary}>
            <Text h4 style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text>Subtotal</Text>
              <Text>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Delivery Fee</Text>
              <Text>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Service Fee</Text>
              <Text>${serviceFee.toFixed(2)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.total}>Total</Text>
              <Text style={styles.total}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      {cartItems.length > 0 && (
        <View style={styles.checkoutButton}>
          <Button
            title="Proceed to Checkout"
            onPress={handleCheckout}
            buttonStyle={{ backgroundColor: '#6B46C1' }}
          />
        </View>
      )}
      {showPayment && (
        <MultiCryptoPayment
          amount={total}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPayment(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cartItems: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    marginHorizontal: 16,
    fontSize: 16,
  },
  summary: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  emptyCart: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
});

export default CartScreen;
