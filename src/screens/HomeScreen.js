import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Icon,
  Image,
  SearchBar,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('Loading...');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for categories
  const categories = [
    { id: 1, name: 'Restaurants', icon: 'restaurant' },
    { id: 2, name: 'Groceries', icon: 'shopping-cart' },
    { id: 3, name: 'Pharmacy', icon: 'local-hospital' },
    { id: 4, name: 'Drinks', icon: 'local-bar' },
  ];

  // Mock data for restaurants
  const restaurants = [
    {
      id: 1,
      name: 'Burger King',
      image: 'https://via.placeholder.com/150',
      rating: 4.5,
      deliveryTime: '20-30 min',
      cuisine: 'Fast Food',
    },
    {
      id: 2,
      name: 'Pizza Hut',
      image: 'https://via.placeholder.com/150',
      rating: 4.3,
      deliveryTime: '25-35 min',
      cuisine: 'Italian',
    },
    // Add more restaurants as needed
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        setAddress(`${address[0].street}, ${address[0].city}`);
      }
    })();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={styles.categoryItem}
          onPress={() => navigation.navigate('Search', { category: category.name })}
        >
          <Icon name={category.icon} type="material" size={30} color="#6B46C1" />
          <Text style={styles.categoryText}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRestaurants = () => (
    <View style={styles.restaurantsContainer}>
      <Text h4 style={styles.sectionTitle}>Popular Restaurants</Text>
      {restaurants.map((restaurant) => (
        <TouchableOpacity
          key={restaurant.id}
          onPress={() => navigation.navigate('Restaurant', { ...restaurant })}
        >
          <Card containerStyle={styles.restaurantCard}>
            <Card.Image
              source={{ uri: restaurant.image }}
              style={styles.restaurantImage}
            />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantDetails}>
                ⭐ {restaurant.rating} • {restaurant.deliveryTime} • {restaurant.cuisine}
              </Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Icon name="location-pin" type="material" size={24} color="#6B46C1" />
          <Text style={styles.locationText}>{address}</Text>
        </View>
        <SearchBar
          placeholder="Search for restaurants or dishes"
          onChangeText={setSearchQuery}
          value={searchQuery}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInput}
          platform="default"
        />
      </View>
      {renderCategories()}
      {renderRestaurants()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 0,
  },
  searchBarInput: {
    backgroundColor: '#f0f0f0',
  },
  categoriesContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  categoryText: {
    marginTop: 8,
    color: '#333',
  },
  restaurantsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  restaurantCard: {
    borderRadius: 8,
    padding: 0,
    marginBottom: 16,
  },
  restaurantImage: {
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  restaurantDetails: {
    color: '#666',
  },
});

export default HomeScreen;
