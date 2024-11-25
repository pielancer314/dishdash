import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Text,
  Image,
  Button,
  Icon,
  Divider,
} from 'react-native-elements';
import { useNavigation, useRoute } from '@react-navigation/native';

const RestaurantScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { name, image, rating, deliveryTime, cuisine } = route.params;
  const [cart, setCart] = useState([]);

  // Mock menu data
  const menu = {
    popular: [
      {
        id: 1,
        name: 'Signature Burger',
        price: 12.99,
        description: 'Our famous burger with special sauce',
        image: 'https://via.placeholder.com/100',
      },
      {
        id: 2,
        name: 'Classic Fries',
        price: 4.99,
        description: 'Crispy golden fries with sea salt',
        image: 'https://via.placeholder.com/100',
      },
    ],
    mains: [
      {
        id: 3,
        name: 'Chicken Sandwich',
        price: 10.99,
        description: 'Grilled chicken with fresh vegetables',
        image: 'https://via.placeholder.com/100',
      },
      {
        id: 4,
        name: 'Veggie Burger',
        price: 11.99,
        description: 'Plant-based patty with special sauce',
        image: 'https://via.placeholder.com/100',
      },
    ],
    sides: [
      {
        id: 5,
        name: 'Onion Rings',
        price: 5.99,
        description: 'Crispy battered onion rings',
        image: 'https://via.placeholder.com/100',
      },
      {
        id: 6,
        name: 'Coleslaw',
        price: 3.99,
        description: 'Fresh cabbage slaw with mayo',
        image: 'https://via.placeholder.com/100',
      },
    ],
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const renderMenuItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => addToCart(item)}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription}>{item.description}</Text>
          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
        </View>
        <Image
          source={{ uri: item.image }}
          style={styles.menuItemImage}
        />
      </View>
      <Divider style={styles.divider} />
    </TouchableOpacity>
  );

  const renderSection = (title, items) => (
    <View style={styles.menuSection}>
      <Text h4 style={styles.sectionTitle}>{title}</Text>
      {items.map(renderMenuItem)}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image
          source={{ uri: image }}
          style={styles.headerImage}
        />
        <View style={styles.headerInfo}>
          <Text h3>{name}</Text>
          <Text style={styles.restaurantDetails}>
            ⭐ {rating} • {deliveryTime} • {cuisine}
          </Text>
        </View>
        <Divider style={styles.divider} />
        {renderSection('Popular Items', menu.popular)}
        {renderSection('Main Courses', menu.mains)}
        {renderSection('Sides', menu.sides)}
      </ScrollView>
      {cart.length > 0 && (
        <View style={styles.cartButton}>
          <Button
            title={`View Cart (${cart.length} items)`}
            onPress={() => navigation.navigate('Cart', { cart })}
            buttonStyle={{ backgroundColor: '#6B46C1' }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerImage: {
    width: '100%',
    height: 200,
  },
  headerInfo: {
    padding: 16,
  },
  restaurantDetails: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  menuSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  menuItem: {
    marginBottom: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cartButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default RestaurantScreen;
