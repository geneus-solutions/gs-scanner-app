
import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

//const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;
const BACKEND = "https://geneus-solutions-backend.onrender.com";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleLogin = async () => {
  try {
    const res = await fetch(`${BACKEND}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    //console.log("Login success:", data);

    if (data.accessToken) {
    // optional: store token later
      await AsyncStorage.setItem("token", data.accessToken);
      await AsyncStorage.setItem("accessToken", data.accessToken);
      await AsyncStorage.setItem("refreshToken", data.refreshToken);

      navigation.replace("Dashboard");
    } else {
      alert(data.message || "Login failed");
    }

  } catch (err) {
    console.log("Login error:", err);
    alert("Server error");
  }
};

  return (
    <View style={{ padding: 20 }}>
      <Text>Login</Text>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Signup" onPress={() => navigation.navigate("Signup")} />
    </View>
  );
}
