
import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";

//const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;
const BACKEND = "https://geneus-solutions-backend.onrender.com";


export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const res = await fetch(`${BACKEND}/api/signup`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) navigation.replace("Dashboard");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Signup</Text>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title="Signup" onPress={handleSignup} />
    </View>
  );
}
