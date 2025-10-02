import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { View } from "react-native";

import { initializeNotificationHandling } from "../lib/notify";

export default function RootLayout() {
  useEffect(() => {
    initializeNotificationHandling();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Slot />
    </View>
  );
}
