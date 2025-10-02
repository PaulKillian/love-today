import AsyncStorage from "@react-native-async-storage/async-storage";
import { Prefs } from "../types";

const PKEY = "prefs";
const PENDING_ACTION_KEY = "pending-action";

type AnyPrefs = Prefs & Record<string, any>;

function isTimeString(value: any): value is string {
  return typeof value === "string" && /^\d{1,2}:\d{2}$/.test(value);
}

function withReminderDefaults(p: AnyPrefs): Prefs {
  const base = isTimeString(p.remindAt) ? p.remindAt : "08:00";
  const weekday = isTimeString(p.remindAtWeekday) ? p.remindAtWeekday : base;
  const weekend = isTimeString(p.remindAtWeekend) ? p.remindAtWeekend : base;
  const catchUp = isTimeString(p.catchUpAt) ? p.catchUpAt : "12:00";

  return {
    ...p,
    remindAt: base,
    remindAtWeekday: weekday,
    remindAtWeekend: weekend,
    catchUpAt: catchUp,
  } as Prefs;
}

function migrate(raw: any): Prefs {
  if (!raw) {
    return {
      profiles: { spouse: { name: "Spouse" }, kids: [{ id: "k1", name: "Kiddo" }] },
      loveLanguages: ["time", "words"],
      timeBudget: "15min",
      moneyBudget: "budget:$",
      faithMode: false,
      remindAt: "08:00",
      remindAtWeekday: "08:00",
      remindAtWeekend: "08:00",
      catchUpAt: "12:00",
      lastShownIds: [],
    };
  }

  const clone: AnyPrefs = { ...raw };

  if (!clone.profiles) {
    const spouseName = clone.names?.spouse || "Spouse";
    const kidsArr = Array.isArray(clone.names?.kids) ? clone.names.kids : ["Kiddo"];
    clone.profiles = {
      spouse: { name: spouseName },
      kids: kidsArr.map((n: string, idx: number) => ({ id: `k${idx + 1}`, name: n || `Kid ${idx + 1}` })),
    };
    delete clone.names;
  }

  if (!clone.loveLanguages) clone.loveLanguages = ["time", "words"];

  return withReminderDefaults(clone);
}

export async function loadPrefs(): Promise<Prefs | null> {
  const raw = await AsyncStorage.getItem(PKEY);
  return migrate(raw ? JSON.parse(raw) : null);
}

export async function savePrefs(p: Prefs) {
  await AsyncStorage.setItem(PKEY, JSON.stringify(p));
}

export async function updateHistory(id: string) {
  const p = (await loadPrefs())!;
  const last = [id, ...(p.lastShownIds || [])].slice(0, 30);
  await savePrefs({ ...p, lastShownIds: last });
}

export type PendingAction = "mark" | "swap";

export async function setPendingAction(action: PendingAction | null) {
  if (!action) {
    await AsyncStorage.removeItem(PENDING_ACTION_KEY);
    return;
  }
  await AsyncStorage.setItem(PENDING_ACTION_KEY, action);
}

export async function consumePendingAction(): Promise<PendingAction | null> {
  const value = await AsyncStorage.getItem(PENDING_ACTION_KEY);
  if (!value) return null;
  await AsyncStorage.removeItem(PENDING_ACTION_KEY);
  if (value === "mark" || value === "swap") return value;
  return null;
}
