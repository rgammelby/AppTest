import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Platform, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API_BASE_URL = Platform.OS === "android" ? "http://10.0.2.2:5105" : "http://localhost:5105";

const LoansScreen: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [loans, setLoans] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchLoans = async () => {
            console.log("Fetching loans... ");
            setIsLoading(true);
            const email = await AsyncStorage.getItem("userEmail");
            if (!email) {
                console.error("Failed to retrieve user email.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/GetUserIdByEmail?email=${email}`);
                if (response.ok) {
                    const userData = await response.json();
                    const userId = userData.id;

                    // Fetch activities (loans) by user ID
                    const activitiesResponse = await fetch(`${API_BASE_URL}/GetActivitiesByUserId/${userId}`);
                    if (activitiesResponse.ok) {
                        const activitiesData = await activitiesResponse.json();
                        setLoans(activitiesData);
                    } else {
                        console.error("Failed to retrieve loan data:", activitiesResponse.status);
                    }
                } else {
                    console.error("Failed to retrieve user ID:", response.status);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }

            setIsLoading(false);
        };

        fetchLoans();
    }, []);

    if (isLoading) {
        return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
    }

    if (loans.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No active loans found.</Text>
                <Button title="Back to Profile" onPress={() => router.push("/explore")} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Your Loans</Text>

        <FlatList
            data={loans}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{item.activity_type}</Text>
                    <Text>Start: {new Date(item.start_date).toLocaleDateString()}</Text>
                    <Text>End: {new Date(item.end_date).toLocaleDateString()}</Text>
                    {item.notes ? <Text>Notes: {item.notes}</Text> : null}
                </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
        />

        <Button title="Back to Profile" onPress={() => router.push("/explore")} />
    </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: "center", padding: 20 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
    flatListContent: { paddingVertical: 10, alignItems: "flex-start" }, // Ensures it doesn't take up extra space
    card: {
        width: 200,
        padding: 15,
        marginHorizontal: 10,
        backgroundColor: "#f8f9fa",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 2, height: 2 },
        elevation: 5,
        alignSelf: "flex-start", // Prevents unnecessary stretching
    },
    cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
});

export default LoansScreen;
