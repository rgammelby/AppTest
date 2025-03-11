import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5105" : "http://localhost:5105";

const LoginScreen: React.FC = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params || {}; // Extract params from the route

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

const handleLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/Login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    console.log("Response: ", response.ok);

    if (response.ok) {
        console.log("Response OK.");
        const result = await response.json();
        if (result.status_code === 200) {
            console.log("Status code: ", result.status_code);
            await AsyncStorage.setItem("authToken", result.token);
            await AsyncStorage.setItem("userEmail", email);

            console.log("Setting authToken and user e-mail: ", result.token, email);
            console.log("Full params object: ", params);

            const redirectPath = params.redirectPath || "/explore";
            console.log("RedirectPath: ", redirectPath);

            const item = params.item ? JSON.parse(params.item) : null;
            console.log("Parsed item: ", item);

            // Ensure router.push is called with the correct parameters
            router.push({
                pathname: redirectPath,
                params: { item: item ? JSON.stringify(item) : null }, // Stringify only if item is not null
            });
        } else {
            setError("Invalid login credentials");
        }
    } else {
        setError("Error logging in. Please try again.");
    }
};


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log in</Text>
            <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log in</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    input: { width: 250, padding: 10, marginBottom: 10, borderWidth: 1, borderRadius: 5 },
    button: { backgroundColor: "#007bff", padding: 10, borderRadius: 5 },
    buttonText: { color: "white", fontWeight: "bold" },
    error: { color: "red", marginBottom: 10 },
});

export default LoginScreen;
