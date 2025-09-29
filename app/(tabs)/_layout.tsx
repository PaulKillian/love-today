import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#fff", tabBarStyle: { backgroundColor: "#111" } }}>
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="moments" options={{ title: "Moments" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen name="share" options={{ title: "Share" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
    </Tabs>
  );
}
