import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Button,
  Linking,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND = "https://geneus-solutions-backend.onrender.com";

export default function PollingScreen({ navigation }) {

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const alertedStocks = useRef(new Set());

  // ===============================
  // ALERT (NEW)
  // ===============================
  function sendAlert(stock) {

    if (!stock || alertedStocks.current.has(stock.symbol)) return;

    alertedStocks.current.add(stock.symbol);

    Alert.alert(
      "🚀 STRONG BUY",
      `${stock.symbol}\nEntry ₹${stock.price}`
    );
  }

  // ===============================
  // TIME FILTER
  // ===============================
  function isTradeAllowedTime() {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const minutes = now.getHours() * 60 + now.getMinutes();

    return (
      minutes > (9 * 60 + 20) &&
      !(minutes >= 12 * 60 && minutes <= 14 * 60) &&
      minutes <= (15 * 60 + 30)
    );
  }

  // ===============================
  // SIGNAL
  // ===============================
  function getSignal(s) {
    if (!s) return null;

    if (s.score >= 130 && s.momentum > 1.2 && s.vol_ratio > 1.8)
      return "STRONG BUY 🚀";

    if (s.score >= 100 && s.momentum > 0.8 && s.vol_ratio > 1.5)
      return "BUY";

    if (s.score <= -120 && s.momentum < -1)
      return "SELL";

    return null;
  }

  // ===============================
  // HIGH QUALITY FILTER
  // ===============================
  function isHighQuality(s) {
    if (!s) return false;

    if (!isTradeAllowedTime()) return false;

    const signal = getSignal(s);
    if (!signal) return false;

    if ((s.vol_ratio || 0) < 1.6) return false;
    if ((s.momentum || 0) < 0.8) return false;
    if ((s.price || 0) < 80) return false;

    return true;
  }

  // ===============================
  // TRADE LEVELS
  // ===============================
  function getTrade(s) {
    const p = Number(s.price || 0);
    return {
      entry: p.toFixed(2),
      sl: (p * 0.985).toFixed(2),
      target: (p * 1.03).toFixed(2)
    };
  }

  // ===============================
  // WHATSAPP FUNCTION
  // ===============================
  const sendWhatsApp = (s) => {

    const t = getTrade(s);

    const msg = `🚀 ${s.symbol} ${getSignal(s)}

Entry: ₹${t.entry}
SL: ₹${t.sl}
Target: ₹${t.target}`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;

    Linking.openURL(url);
  };

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {

    const fetchData = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/scanner-polling`);
        const json = await res.json();

        // 🔥 ALERT TRIGGER (NEW)
        (json.stockOfDay || []).forEach(s => {
          if (getSignal(s) === "STRONG BUY 🚀" && isTradeAllowedTime()) {
            sendAlert(s);
          }
        });

        setData(json || {});
        setLoading(false);
      } catch (err) {
        console.log("Polling error:", err);
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);

  }, []);

  // ===============================
  // CARD
  // ===============================
  const renderCard = (s, highlight = false) => {

    const signal = getSignal(s);
    if (!signal) return null;

    const t = getTrade(s);

    return (
      <View
        key={s.symbol}
        style={{
          backgroundColor: highlight ? "#fff3cd" : "#fff",
          padding: 12,
          marginBottom: 10,
          borderRadius: 10,
          borderLeftWidth: 5,
          borderLeftColor:
            signal.includes("BUY")
              ? "green"
              : signal.includes("SELL")
              ? "red"
              : "gray"
        }}
      >
        <Text style={{ fontWeight: "bold" }}>
          {highlight ? "⭐ " : ""}{s.symbol}
        </Text>

        <Text>₹ {Number(s.price).toFixed(2)}</Text>

        <Text style={{ fontWeight: "bold" }}>
          🎯 {signal}
        </Text>

        <Text>Entry: ₹{t.entry}</Text>
        <Text style={{ color: "red" }}>SL: ₹{t.sl}</Text>
        <Text style={{ color: "green" }}>Target: ₹{t.target}</Text>

        <Button
          title="Send WhatsApp"
          onPress={() => sendWhatsApp(s)}
        />
      </View>
    );
  };

  // ===============================
  // SECTION
  // ===============================
  const section = (title, list = []) => {

    const filtered = (list || [])
      .filter(s => isHighQuality(s))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          {title}
        </Text>

        {filtered.length === 0 ? (
          <Text>No high-quality signals</Text>
        ) : (
          filtered.map((s, i) => renderCard(s, i === 0))
        )}
      </View>
    );
  };

  // ===============================
  // LOGOUT
  // ===============================
  const logout = async () => {
    await AsyncStorage.removeItem("accessToken");
    navigation.replace("Login");
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} size="large" />;
  }

  return (
    <ScrollView style={{ padding: 15 }}>

      <Button title="Logout" onPress={logout} />

      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        ⚡ Intraday Polling Scanner
      </Text>

      <Text style={{ marginTop: 5 }}>
        {isTradeAllowedTime()
          ? "🟢 Trading Time"
          : "🔴 Avoid Trading Time"}
      </Text>

      {section("🔥 Best Trade", data.bestTradeCandidate)}
      {section("🔥 Stock of the Day", data.stockOfDay)}
      {section("🔥 Gap Momentum", data.gapMomentum)}
      {section("🔥 Volume Spike", data.volumeSpike)}
      {section("🔥 Relative Strength", data.relativeStrengthLeaders)}

    </ScrollView>
  );
}