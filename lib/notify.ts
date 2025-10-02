import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { Prefs } from "../types";
import { setPendingAction } from "./storage";
import { loadStreak } from "./streaks";

const IS_WEB = Platform.OS === "web";
const DAILY_CATEGORY = "love-today-daily";
const ACTION_MARK = "mark-today";
const ACTION_SWAP = "swap-idea";

let categoriesRegistered = false;
let responseSubscription: Notifications.Subscription | null = null;

function parseTime(value: string | undefined, fallback: string): { hour: number; minute: number } {
  const time = typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value) ? value : fallback;
  const [h, m] = time.split(":" ).map((n) => parseInt(n, 10));
  return { hour: Math.min(Math.max(h || 0, 0), 23), minute: Math.min(Math.max(m || 0, 0), 59) };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function prevISO(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function ensureCategories() {
  if (IS_WEB || categoriesRegistered) return;
  await Notifications.setNotificationCategoryAsync(DAILY_CATEGORY, [
    {
      identifier: ACTION_MARK,
      buttonTitle: "Mark done",
      textInput: undefined,
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_SWAP,
      buttonTitle: "Swap idea",
      textInput: undefined,
      options: { opensAppToForeground: true },
    },
  ]);
  categoriesRegistered = true;
}

export async function ensureNotiPermissions() {
  if (IS_WEB) return;
  if (!Device.isDevice) return;

  await ensureCategories();

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

export async function initializeNotificationHandling() {
  if (IS_WEB) return;
  await ensureCategories();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
    handleSuccess: () => {},
    handleError: () => {},
  });

  if (responseSubscription) {
    responseSubscription.remove();
  }

  responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const action = response.actionIdentifier;
    if (action === ACTION_MARK) {
      await setPendingAction("mark");
    } else if (action === ACTION_SWAP) {
      await setPendingAction("swap");
    }
  });
}

async function scheduleWeeklyReminder(hour: number, minute: number, weekdays: number[], content: Notifications.NotificationContentInput) {
  await Promise.all(
    weekdays.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content,
        trigger: { weekday, hour, minute, repeats: true },
      })
    )
  );
}

export async function scheduleReminders(prefs: Prefs) {
  if (IS_WEB) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const baseFallback = prefs.remindAt ?? "08:00";
    const weekdayTime = parseTime(prefs.remindAtWeekday ?? prefs.remindAt, baseFallback);
    const weekendTime = parseTime(prefs.remindAtWeekend ?? prefs.remindAt, baseFallback);

    const baseContent: Notifications.NotificationContentInput = {
      title: "Today's Love Idea",
      body: "Tap to see a simple way to show love today.",
      categoryIdentifier: DAILY_CATEGORY,
    };

    await scheduleWeeklyReminder(weekdayTime.hour, weekdayTime.minute, [2, 3, 4, 5, 6], baseContent);
    await scheduleWeeklyReminder(weekendTime.hour, weekendTime.minute, [1, 7], baseContent);

    const streak = await loadStreak();
    const today = todayISO();
    const yesterday = prevISO(today);
    const lastDone = streak.lastDoneISO;
    const shouldCatchUp = !lastDone || (lastDone !== today && lastDone !== yesterday);

    if (shouldCatchUp) {
      const catchUp = parseTime(prefs.catchUpAt ?? "12:00", "12:00");
      const now = new Date();
      const triggerDate = new Date();
      triggerDate.setHours(catchUp.hour, catchUp.minute, 0, 0);
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Missed yesterday?",
          body: "Pick a new idea or mark it done to keep your streak alive.",
          categoryIdentifier: DAILY_CATEGORY,
        },
        trigger: triggerDate,
      });
    }
  } catch (err) {
    console.warn("[notifications] schedule failed:", err);
  }
}
