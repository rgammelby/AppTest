import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect, usePathname } from "expo-router";

const API_BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:5105" : "http://localhost:5105";

const ProfileScreen: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    // Check login status on screen focus
    useFocusEffect(
        useCallback(() => {
            const checkLoginStatus = async () => {
                setIsLoading(true);
                const token = await AsyncStorage.getItem("authToken");
                if (!token) {
                    console.log("No token found, redirecting to login.");
                    setIsLoggedIn(false);
                    await AsyncStorage.setItem("redirectAfterLogin", pathname);
                    router.push({ pathname: "/login", params: { redirectPath: pathname } });
                } else {
                    console.log("Authenticated with token:", token);
                    setIsLoggedIn(true);
                }
                setIsLoading(false);
            };

            checkLoginStatus();
        }, [pathname])
    );

    // Fetch user data when logged in
    useEffect(() => {
        const fetchUserData = async () => {
            const email = await AsyncStorage.getItem("userEmail");
            if (!email) {
                console.log("Failed to retrieve email.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/GetUserIdByEmail?email=${email}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    console.error("Failed to retrieve user data:", response.status);
                }
            } catch (error) {
                console.error("Error calling GetUserIdByEmail:", error);
            }
        };

        if (isLoggedIn) {
            fetchUserData();
        }
    }, [isLoggedIn]);

    // Handle logout
    const handleLogout = async () => {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("userEmail");
        setIsLoggedIn(false);
        setUserData(null);
        router.push("/");
    };

    if (isLoading) {
        return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
    }

    if (!userData) {
        return <Text>Loading user data...</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Your Profile!</Text>
            <Text>E-mail address: {userData.email}</Text>
            <Text>Full name: {userData.first_name} {userData.last_name}</Text>
            <Text>Phone number: {userData.telephone}</Text>
            
            {/* Log Out Button */}
            <Button title="Log Out" onPress={handleLogout} />
            
            {/* Loans Button */}
            <Button title="Loans" onPress={() => router.push("/loans")} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    loader: { flex: 1, justifyContent: "center" },
});

export default ProfileScreen;
