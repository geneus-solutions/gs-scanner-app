import React, {
  useEffect,
  useState,
  useRef
} from "react";

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

// ======================================
// KEEP EXISTING BACKEND
// ======================================

const BACKEND =
  "https://geneus-solutions-backend.onrender.com";

export default function PollingScreen({
  navigation
}) {

  // ======================================
  // STATE
  // ======================================

  const [buyStocks, setBuyStocks] =
    useState([]);

  const [shortStocks, setShortStocks] =
    useState([]);

  const [bestTrade, setBestTrade] =
    useState(null);

  const [niftyMove, setNiftyMove] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const alertedStocks =
    useRef(new Set());

  // ======================================
  // SAFE TIME
  // ======================================

  function isSafeTime() {

    const now = new Date(
      new Date().toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Kolkata"
        }
      )
    );

    const mins =
      now.getHours() * 60 +
      now.getMinutes();

    return (
      mins >= 570 &&
      mins <= 915
    );

  }

  // ======================================
  // SIGNALS
  // ======================================

  function getBuySignal(s) {

    if (!isSafeTime()) {
      return "WAIT ⏳";
    }

    if (
      s.momentum > 1 &&
      s.priceStrength > 0.5 &&
      s.vol_ratio > 1.5
    ) {

      return "TRIGGER 🟢";

    }

    return "WATCH 👀";

  }

  function getShortSignal(s) {

    if (!isSafeTime()) {
      return "WAIT ⏳";
    }

    if (
      s.momentum < -1 &&
      s.priceStrength < -0.5 &&
      s.vol_ratio > 1.5
    ) {

      return "TRIGGER 🔴";

    }

    return "WATCH 👀";

  }

  // ======================================
  // TRADE LEVELS
  // ======================================

  function getBuyTrade(s) {

    return {

      entry:
        Number(s.price).toFixed(2),

      sl:
        (
          s.price * 0.995
        ).toFixed(2),

      target:
        (
          s.price * 1.01
        ).toFixed(2)

    };

  }

  function getShortTrade(s) {

    return {

      entry:
        Number(s.price).toFixed(2),

      sl:
        (
          s.price * 1.005
        ).toFixed(2),

      target:
        (
          s.price * 0.99
        ).toFixed(2)

    };

  }

  // ======================================
  // REMOVE DUPLICATES
  // ======================================

  function removeDuplicates(arr = []) {

    const map = new Map();

    arr.forEach(item => {

      if (!item?.symbol) return;

      const existing =
        map.get(item.symbol);

      if (
        !existing ||
        Math.abs(item.score || 0) >
        Math.abs(existing.score || 0)
      ) {

        map.set(
          item.symbol,
          item
        );

      }

    });

    return [...map.values()];

  }

  // ======================================
  // ALERT
  // ======================================

  function sendAlert(stock) {

    if (
      !stock ||
      alertedStocks.current.has(
        stock.symbol
      )
    ) {
      return;
    }

    alertedStocks.current.add(
      stock.symbol
    );

    Alert.alert(

      stock.type === "SHORT"
        ? "🔻 SHORT ALERT"
        : "🚀 BUY ALERT",

      `${stock.symbol}
Entry ₹${stock.entry}`

    );

  }

  // ======================================
  // WHATSAPP
  // KEEP EXISTING
  // ======================================

  const sendWhatsApp = (
    s,
    type = "BUY"
  ) => {

    const t =
      type === "BUY"
        ? getBuyTrade(s)
        : getShortTrade(s);

    const signal =
      type === "BUY"
        ? getBuySignal(s)
        : getShortSignal(s);

    const msg = `⚡ Intraday Scanner

${signal}

${s.symbol}

Entry: ₹${t.entry}
SL: ₹${t.sl}
Target: ₹${t.target}`;

    const url =
      `https://wa.me/?text=${encodeURIComponent(msg)}`;

    Linking.openURL(url);

  };

  // ======================================
  // FETCH DATA
  // ======================================

  useEffect(() => {

    const fetchData =
      async () => {

        try {

          const res =
            await fetch(
              `${BACKEND}/api/scanner-polling`
            );

          const json =
            await res.json();

          setBuyStocks(

            removeDuplicates(
              json.buyCandidates || []
            )

          );

          setShortStocks(

            removeDuplicates(
              json.shortCandidates || []
            )

          );

          setBestTrade(
            json.bestTradeCandidate || null
          );

          setNiftyMove(
            json.niftyMove || 0
          );

          // ALERT

          if (
            json.bestTradeCandidate &&
            isSafeTime()
          ) {

            sendAlert(
              json.bestTradeCandidate
            );

          }

          setLoading(false);

        }

        catch (err) {

          console.log(
            "Polling error:",
            err
          );

          setLoading(false);

        }

      };

    fetchData();

    const interval =
      setInterval(
        fetchData,
        7000
      );

    return () =>
      clearInterval(interval);

  }, []);

  // ======================================
  // LOGOUT
  // ======================================

  const logout =
    async () => {

      await AsyncStorage.removeItem(
        "accessToken"
      );

      navigation.replace(
        "Login"
      );

    };

  // ======================================
  // CARD
  // ======================================

  const renderCard = (
    s,
    type = "BUY",
    highlight = false
  ) => {

    const signal =
      type === "BUY"
        ? getBuySignal(s)
        : getShortSignal(s);

    const t =
      type === "BUY"
        ? getBuyTrade(s)
        : getShortTrade(s);

    return (

      <View

        key={s.symbol}

        style={{

          backgroundColor:
            highlight
              ? "#fff3cd"
              : "#fff",

          padding: 14,

          marginBottom: 12,

          borderRadius: 12,

          borderLeftWidth: 6,

          borderLeftColor:
            type === "BUY"
              ? "green"
              : "red"

        }}
      >

        <Text style={{
          fontWeight: "bold",
          fontSize: 16
        }}>
          {highlight ? "⭐ " : ""}
          {s.symbol}
        </Text>

        <Text>
          ₹ {Number(s.price).toFixed(2)}
        </Text>

        <Text style={{
          color:
            type === "BUY"
              ? "green"
              : "red",

          fontWeight: "bold",

          marginTop: 4
        }}>
          {signal}
        </Text>

        <Text>
          Momentum:
          {" "}
          {Number(s.momentum).toFixed(2)}%
        </Text>

        <Text>
          Volume:
          {" "}
          {Number(s.vol_ratio).toFixed(2)}x
        </Text>

        <Text>
          Entry:
          {" "}
          ₹{t.entry}
        </Text>

        <Text style={{
          color: "red"
        }}>
          SL:
          {" "}
          ₹{t.sl}
        </Text>

        <Text style={{
          color: "green"
        }}>
          Target:
          {" "}
          ₹{t.target}
        </Text>

        <View style={{
          marginTop: 10
        }}>
          <Button
            title="Send WhatsApp"
            onPress={() =>
              sendWhatsApp(
                s,
                type
              )
            }
          />
        </View>

      </View>

    );

  };

  // ======================================
  // SECTION
  // ======================================

  const section = (
    title,
    list = [],
    type = "BUY"
  ) => {

    return (

      <View style={{
        marginTop: 20
      }}>

        <Text style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 12,
          color:
            type === "BUY"
              ? "green"
              : "red"
        }}>
          {title}
        </Text>

        {list.length === 0 ? (

          <Text>
            No Signals
          </Text>

        ) : (

          list
            .slice(0, 5)
            .map((s, i) =>

              renderCard(
                s,
                type,
                i === 0
              )

            )

        )}

      </View>

    );

  };

  // ======================================
  // LOADING
  // ======================================

  if (loading) {

    return (

      <ActivityIndicator
        style={{
          marginTop: 50
        }}
        size="large"
      />

    );

  }

  // ======================================
  // UI
  // ======================================

  return (

    <ScrollView style={{
      flex: 1,
      padding: 15,
      backgroundColor: "#f4f7fb"
    }}>

      {/* HEADER */}

      <Button
        title="Logout"
        onPress={logout}
      />

      <Text style={{
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 15
      }}>
        ⚡ Intraday Scanner Pro
      </Text>

      {/* MARKET */}

      <View style={{
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginTop: 15
      }}>

        <Text style={{
          fontWeight: "bold",
          fontSize: 16
        }}>
          NIFTY:
          {" "}
          <Text style={{
            color:
              niftyMove >= 0
                ? "green"
                : "red"
          }}>
            {Number(niftyMove).toFixed(2)}%
          </Text>
        </Text>

        <Text style={{
          marginTop: 6
        }}>
          {isSafeTime()
            ? "🟢 Safe Trading Time"
            : "🔴 Avoid Trading Time"}
        </Text>

      </View>

      {/* BEST TRADE */}

      {bestTrade && (

        <View style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 12,
          marginTop: 20,
          borderWidth: 2,
          borderColor:
            bestTrade.type === "BUY"
              ? "green"
              : "red"
        }}>

          <Text style={{
            fontSize: 18,
            fontWeight: "bold"
          }}>
            🎯 Best Trade
          </Text>

          <Text style={{
            marginTop: 10
          }}>
            Type:
            {" "}
            {bestTrade.type}
          </Text>

          <Text>
            Symbol:
            {" "}
            {bestTrade.symbol}
          </Text>

          <Text>
            Entry:
            {" "}
            ₹{bestTrade.entry}
          </Text>

          <Text style={{
            color: "red"
          }}>
            SL:
            {" "}
            ₹{bestTrade.sl}
          </Text>

          <Text style={{
            color: "green"
          }}>
            Target:
            {" "}
            ₹{bestTrade.target}
          </Text>

        </View>

      )}

      {/* BUY */}

      {section(
        "🚀 BUY CANDIDATES",
        buyStocks,
        "BUY"
      )}

      {/* SHORT */}

      {section(
        "🔻 SHORT CANDIDATES",
        shortStocks,
        "SHORT"
      )}

      <View style={{
        height: 40
      }} />
      

    </ScrollView>

  );

}