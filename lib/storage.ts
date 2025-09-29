import AsyncStorage from "@react-native-async-storage/async-storage";
import { Prefs } from "../types";

const PKEY = "prefs";

function migrate(raw: any): Prefs {
  if (!raw) {
    return {
      profiles: { spouse: { name: "Spouse" }, kids: [{ id: "k1", name: "Kiddo" }] },
      loveLanguages: ["time","words"],
      timeBudget: "15min",
      moneyBudget: "budget:$",
      faithMode: false,
      remindAt: "08:00",
      lastShownIds: []
    };
  }
  if (!raw.profiles) {
    const spouseName = raw.names?.spouse || "Spouse";
    const kidsArr = Array.isArray(raw.names?.kids) ? raw.names.kids : ["Kiddo"];
    raw.profiles = {
      spouse: { name: spouseName },
      kids: kidsArr.map((n: string, idx: number) => ({ id: `k${idx+1}`, name: n || `Kid ${idx+1}` }))
    };
    delete raw.names;
  }
  if (!raw.loveLanguages) raw.loveLanguages = ["time","words"];
  return raw as Prefs;
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
