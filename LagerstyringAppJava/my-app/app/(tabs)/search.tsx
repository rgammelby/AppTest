import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Platform, Text, View, TextInput, Button, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const API_BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:5105" : "http://localhost:5105";

const Search = () => {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [devices, setDevices] = useState<any[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
      console.log("Running useEffect for orientation. ");
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      console.log("Width: ", width, "Height: ", height);
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription.remove();
  }, []);

  const fetchWithCors = async (url: string) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API fetch error:", error);
      throw error;
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);

    try {
      const devices = await fetchWithCors(`${API_BASE_URL}/api/Device/${query}`);
      if (devices.length > 0) {
        const statusDataPromises = devices.map(async (device) => {
          const statusData = await fetchWithCors(`${API_BASE_URL}/GetStatusTypeById/${device.status}`);
          const deviceOverviewData = await fetchWithCors(`${API_BASE_URL}/api/DeviceOverview/${device.device_overview_id}`);

          let locationDetails = 'N/A';
          if (device.location) {
            const cupboardData = await fetchWithCors(`${API_BASE_URL}/GetCupboardById/${device.location}`);
            if (cupboardData && cupboardData.room_id) {
              const roomData = await fetchWithCors(`${API_BASE_URL}/GetRoomById/${cupboardData.room_id}`);
              locationDetails = `${cupboardData.designation} - ${roomData?.designation || 'Unknown Room'}`;
            } else {
              locationDetails = cupboardData?.designation || 'Unknown Cupboard';
            }
          }

          return { device, statusData, deviceOverviewData, locationDetails };
        });

        const devicesWithDetails = await Promise.all(statusDataPromises);
        setDevices(devicesWithDetails);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error("Error fetching device details:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderDevice = ({ item }) => {
    const { device, statusData, deviceOverviewData, locationDetails } = item;
    return (
      <View style={styles.deviceInfoContainer}>
        <ThemedText type="subtitle">Device Info:</ThemedText>
        <Text>ID: {device.id}</Text>
        <Text>Description: {device.description}</Text>
        <Text>Status: {statusData?.status_type || 'N/A'}</Text>
        <Text>Device Type: {deviceOverviewData?.model || 'N/A'}</Text>
        <Text>Location: {locationDetails || 'N/A'}</Text>
        <Text>QR: {device.qr || 'N/A'}</Text>
        <Button title="Borrow" onPress={() => navigation.navigate('Borrow', { item })} />
      </View>
    );
  };

  return (
    <View style={orientation === 'portrait' ? styles.portraitContainer : styles.landscapeContainer}>
      <ParallaxScrollView headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={<Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Search for a Device!</ThemedText>
          <HelloWave />
        </ThemedView>
        <View style={styles.searchContainer}>
          <TextInput value={query} onChangeText={setQuery} placeholder="Enter device name" style={styles.input} />
          <Button title="Search" onPress={handleSearch} />
        </View>
        {loading && <ActivityIndicator size="large" color="blue" style={styles.loadingIndicator} />}
        {devices.length > 0 ? (
          <FlatList data={devices} keyExtractor={(item, index) => item.device.id || index.toString()} renderItem={renderDevice} />
        ) : (!loading && <Text style={styles.noResults}>No devices found for "{query}"</Text>)}
      </ParallaxScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  portraitContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#d0d0d0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  loadingIndicator: {
    marginTop: 16,
  },
  deviceInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  noResults: {
    marginTop: 16,
    textAlign: 'center',
    color: 'gray',
  },
});

export default Search;
