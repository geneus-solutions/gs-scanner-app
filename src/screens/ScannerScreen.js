import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Button,
  Linking
} from "react-native";
import { io } from "socket.io-client";

const BACKEND = "https://geneus-solutions-backend.onrender.com";

export default function ScannerScreen() {

  const [topStocks, setTopStocks] = useState([]);
  const [weakStocks, setWeakStocks] = useState([]);
  const [gapStocks, setGapStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const alertedStocks = useRef(new Set());

  // ===============================
  // MARKET TIME CHECK
  // ===============================
  function isMarketOpen() {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const minutes = now.getHours() * 60 + now.getMinutes();

    return (
      minutes >= (9 * 60 + 15) &&
      minutes <= (15 * 60 + 30)
    );
  }

  // ===============================
  // SAFE TRADING WINDOW (FILTER)
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
  // ALERT
  // ===============================
  function sendAlert(stock) {

    if (!isTradeAllowedTime()) return; // 🔒 block alerts outside time

    if (!stock || alertedStocks.current.has(stock.symbol)) return;

    alertedStocks.current.add(stock.symbol);

    Alert.alert(
      "🚀 STRONG BUY",
      `${stock.symbol}\nEntry ₹${stock.price}`
    );
  }

  // ===============================
  // SIGNAL
  // ===============================
  function getSignal(s) {
    if (!s) return null;

    if (s.score >= 130 && s.momentum > 1.2 && s.vol_ratio > 1.5)
      return "STRONG BUY 🚀";

    if (s.score >= 100 && s.momentum > 0.8 && s.vol_ratio > 1.5)
      return "BUY";

    if (s.score <= -120 && s.momentum < -1)
      return "SELL";

    return null;
  }

  // ===============================
  // FILTER
  // ===============================
  function isHighQuality(s) {
    if (!s) return false;

    if (!isTradeAllowedTime()) return false;
    if (!getSignal(s)) return false;
    if ((s.vol_ratio || 0) < 1.5) return false;
    if ((s.price || 0) < 50) return false;

    return true;
  }

  // ===============================
  // TRADE
  // ===============================
  function getTrade(s) {
    const price = Number(s.price || 0);
    return {
      entry: price.toFixed(2),
      sl: (price * 0.985).toFixed(2),
      target: (price * 1.03).toFixed(2)
    };
  }

  // ===============================
  // WHATSAPP
  // ===============================
  const sendWhatsApp = (s) => {
    const t = getTrade(s);

    const msg = `🚀 ${s.symbol} ${getSignal(s)}

Entry: ₹${t.entry}
SL: ₹${t.sl}
Target: ₹${t.target}`;

    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  // ===============================
  // INITIAL FETCH
  // ===============================
  useEffect(() => {
    fetch(`${BACKEND}/api/scanner`)
      .then(res => res.json())
      .then(data => {
        setTopStocks(data.top || []);
        setWeakStocks(data.weak || []);
        setGapStocks(data.gap || []);
        setLoading(false);
      });
  }, []);

  // ===============================
  // SOCKET
  // ===============================
  useEffect(() => {

    const socket = io(BACKEND, { transports: ["websocket"] });

    socket.on("connect", () => setConnected(true));

    socket.on("scanner_realtime", (data) => {

      const filtered = (data.top || []).filter(isHighQuality);

      filtered.forEach(s => {
        if (getSignal(s) === "STRONG BUY 🚀") {
          sendAlert(s);
        }
      });

      setTopStocks(data.top || []);
      setWeakStocks(data.weak || []);
      setGapStocks(data.gap || []);
      setLoading(false);
    });

    socket.on("disconnect", () => setConnected(false));

    return () => socket.disconnect();

  }, []);

  // ===============================
  // CARD
  // ===============================
  const renderCard = (s) => {

    const signal = getSignal(s);
    if (!signal) return null;

    const trade = getTrade(s);

    return (
      <View key={s.symbol} style={{
        backgroundColor: "#fff",
        padding: 12,
        marginBottom: 10,
        borderRadius: 10,
        borderLeftWidth: 5,
        borderLeftColor: signal.includes("BUY") ? "green" : "red"
      }}>
        <Text style={{ fontWeight: "bold" }}>{s.symbol}</Text>
        <Text>₹ {Number(s.price).toFixed(2)}</Text>

        <Text>🎯 {signal}</Text>

        <Text>Entry: ₹{trade.entry}</Text>
        <Text style={{ color: "red" }}>SL: ₹{trade.sl}</Text>
        <Text style={{ color: "green" }}>Target: ₹{trade.target}</Text>

        <Button title="WhatsApp" onPress={() => sendWhatsApp(s)} />
      </View>
    );
  };

  // ===============================
  // LOADING
  // ===============================
  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  const marketOpen = isMarketOpen();

  // ===============================
  // UI
  // ===============================
  return (
    <ScrollView style={{ padding: 15 }}>

      <Text style={{ fontSize: 18 }}>⚡ Intraday Scanner</Text>

      <Text>{connected ? "🟢 Live" : "🔴 Offline"}</Text>

      {/* MARKET STATUS */}
      <Text style={{ marginTop: 5 }}>
        {marketOpen ? "🟢 Market Open" : "🔴 Market Closed"}
      </Text>

      {!marketOpen && (
        <Text style={{ color: "red", marginTop: 5 }}>
          ⚠ Signals disabled (market closed)
        </Text>
      )}

      <Text>🚀 Top</Text>
      {marketOpen && topStocks.filter(isHighQuality).slice(0, 5).map(renderCard)}

      <Text>⚠ Weak</Text>
      {marketOpen && weakStocks.filter(isHighQuality).slice(0, 3).map(renderCard)}

      <Text>🔥 Gap</Text>
      {marketOpen && gapStocks.filter(isHighQuality).slice(0, 3).map(renderCard)}

    </ScrollView>
  );
}