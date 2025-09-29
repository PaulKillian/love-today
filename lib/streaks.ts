import AsyncStorage from "@react-native-async-storage/async-storage";

type StreakState = {
  lastDoneISO: string | null; // e.g. "2025-09-29"
  current: number;
  longest: number;
};

const KEY = "streaks";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function prevISO(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function loadStreak(): Promise<StreakState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { lastDoneISO: null, current: 0, longest: 0 };
  return JSON.parse(raw) as StreakState;
}

async function saveStreak(s: StreakState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(s));
}

/** Call when user taps “Done” (only once per day matters). */
export async function tickStreak(): Promise<StreakState> {
  const s = await loadStreak();
  const today = todayISO();

  if (s.lastDoneISO === today) {
    // Already counted today
    return s;
  }

  // If yesterday was last done => continue; else reset
  const cont = s.lastDoneISO && prevISO(today) === s.lastDoneISO;
  const current = cont ? s.current + 1 : 1;
  const longest = Math.max(current, s.longest);
  const next: StreakState = { lastDoneISO: today, current, longest };
  await saveStreak(next);
  return next;
}
