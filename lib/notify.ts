import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const IS_WEB = Platform.OS === "web";

export async function ensureNotiPermissions() {
  // On web preview, do nothing.
  if (IS_WEB) return;

  if (!Device.isDevice) return; // simulators sometimes block notifications
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

export async function scheduleDailyLocal(hour: number, minute: number) {
  // On web preview, do nothing to avoid the crash.
  if (IS_WEB) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today’s Love Idea",
        body: "Tap to see a simple way to show love today.",
      },
      trigger: { hour, minute, repeats: true },
    });
  } catch (err) {
    // Log but don't crash the app
    console.warn("[notifications] schedule failed:", err);
  }
}
