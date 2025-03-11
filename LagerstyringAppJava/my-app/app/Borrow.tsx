import React, { useEffect, useState, useCallback } from "react";
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { View, Text, Button, ActivityIndicator, StyleSheet, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect, usePathname } from "expo-router";
import QRScanner from './QRScanner';

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5105" : "http://localhost:5105";

const Borrow = ({ handleGoBack }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [item, setItem] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  const route = useRoute();
  const pathname = usePathname();
  const router = useRouter();

  const getUserIdByEmail = async () => {
    const email = await AsyncStorage.getItem("userEmail");
    if (email) {
      try {
        const response = await fetch(`${API_BASE_URL}/GetUserIdByEmail?email=${email}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Data: ", data);
          setUserId(data.id); // Assuming the response has userId
        } else {
          console.error("Failed to retrieve user data:", response.status);
        }
      } catch (error) {
        console.error("Error calling GetUserIdByEmail:", error);
      }
    } else {
      console.log("Failed to retrieve email.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkLoginStatus = async () => {
        try {
          const token = await AsyncStorage.getItem("authToken");
          await AsyncStorage.setItem("borrowItem", JSON.stringify(route.params?.item));
  
          if (!token) {
            await AsyncStorage.setItem("redirectAfterLogin", pathname);
            navigation.navigate("login", { redirectPath: pathname });
          } else {
            const storedItem = await AsyncStorage.getItem("borrowItem");
            if (storedItem) {
              const parsedItem = JSON.parse(storedItem);
              setItem(parsedItem);
              setIsScanning(true); // Require scanning again for new item
              setScanSuccess(false);
            }
            getUserIdByEmail();
          }
        } catch (error) {
          console.error("Error checking login status:", error);
        }
      };
      checkLoginStatus();
    }, [pathname, navigation, route.params?.item]) // Depend on route.params?.item
  );
  

  const handleScanSuccess = () => {
    setScanSuccess(true);
    setIsScanning(false);
    console.log("Scan successful! Proceeding...");
  };

  const handleConfirmLoan = async () => {
    console.log("handleConfirmLoan initiated. userId: ", userId);
    if (!item || !userId) return;
  
    const { device, deviceOverviewData } = item;
    const start_date = new Date();
    let end_date = new Date(start_date);
    end_date.setDate(end_date.getDate() + 7);
  
    if (end_date.getDay() === 6) end_date.setDate(end_date.getDate() + 2);
    if (end_date.getDay() === 0) end_date.setDate(end_date.getDate() + 1);
  
    const activityData = {
      user_id: userId, // Use the fetched userId
      device_id: device.id,
      activity_type: 1,
      start_date: start_date.toISOString(),
      end_date: end_date.toISOString(),
      created_at: start_date.toISOString(),
      notes: `${deviceOverviewData.model} with ID: ${device.id} has been borrowed.`,
      // Omitting lifecycle_id, it will be handled by the server
    };
  
    console.log("Submitting activity:", activityData);
  
    try {
      const response = await fetch(`${API_BASE_URL}/AddActivity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityData),
      });
  
      const rawResponse = await response.text();
      console.log("Raw response from AddActivity endpoint:", rawResponse);
  
      const responseData = JSON.parse(rawResponse);
      console.log("Parsed response:", responseData);
  
      if (response.ok) {
        Alert.alert("Success", "Loan confirmed!", [{ text: "OK", onPress: () => router.push("/") }]);
        await AsyncStorage.removeItem("borrowItem");
      } else {
        console.error("Failed to add activity:", responseData);
      }
    } catch (error) {
      console.error("Error confirming loan:", error);
    }
  };
  
  
  

  const handleCancel = async () => {
    Alert.alert("Cancel Loan", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await AsyncStorage.removeItem("borrowItem");
          setScanSuccess(false);
          setIsScanning(true);
          router.push("/");
        },
      },
    ]);
  };

  if (!item || !item.device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No device selected.</Text>
        <Button title="Go Back" onPress={() => router.push('/search')} />
      </View>
    );
  }

  const { device, statusData, deviceOverviewData, locationDetails } = item;

  return (
    <View style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Borrow Device</ThemedText>
      </ThemedView>
      <View style={styles.deviceInfoContainer}>
        <Text>ID: {device.id}</Text>
        <Text>Description: {device.description}</Text>
        <Text>Status: {statusData?.status_type || 'N/A'}</Text>
        <Text>Device Type: {deviceOverviewData?.model || 'N/A'}</Text>
        <Text>Location: {locationDetails || 'N/A'}</Text>
        <Text>QR: {device.qr || 'N/A'}</Text>
      </View>

      {isScanning ? (
        <QRScanner expectedValue={device.qr} onScanSuccess={handleScanSuccess} />
      ) : (
        <View>
          <Button title="Confirm Loan" onPress={handleConfirmLoan} />
          <Button title="Cancel" onPress={handleCancel} color="red" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f0f0f0' },
  titleContainer: { marginBottom: 16 },
  deviceInfoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 16 },
});

export default Borrow;
