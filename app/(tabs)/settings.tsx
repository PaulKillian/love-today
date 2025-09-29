import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleDailyLocal } from "../../lib/notify";
import { loadPrefs, savePrefs } from "../../lib/storage";
import { LoveLang, Prefs } from "../../types";

const ALL_LL: LoveLang[] = ["time", "words", "gifts", "service", "touch"];
const DUR: Prefs["timeBudget"][] = ["5min", "15min", "30min"];
const MONEY: Prefs["moneyBudget"][] = ["budget:$", "budget:$$"];

export default function Settings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [remindAt, setRemindAt] = useState("08:00");
  const [spouseName, setSpouseName] = useState("Spouse");
  const [kidsCSV, setKidsCSV] = useState("Kiddo");
  const [spouseLL, setSpouseLL] = useState<LoveLang[]>(["time", "words"]);
  const [kidsLL, setKidsLL] = useState<LoveLang[]>(["time", "words"]);

  useEffect(() => {
    (async () => {
      const p = (await loadPrefs()) ?? ({
        profiles: { spouse: { name: "Spouse" }, kids: [{ id: "k1", name: "Kiddo" }] },
        loveLanguages: ["time","words"],
        timeBudget: "15min",
        moneyBudget: "budget:$",
        faithMode: false,
        remindAt: "08:00",
        lastShownIds: []
      } as Prefs);
      setPrefs(p);
      setRemindAt(p.remindAt || "08:00");
      setSpouseName(p.profiles?.spouse?.name || "Spouse");
      setKidsCSV((p.profiles?.kids || []).map(k => k.name).join(", "));
      setSpouseLL(p.spouseLoveLanguages?.length ? p.spouseLoveLanguages : p.loveLanguages || []);
      const firstKidId = p.profiles?.kids?.[0]?.id;
      setKidsLL((firstKidId && p.kidsLoveLanguages?.[firstKidId]?.length) ? p.kidsLoveLanguages[firstKidId]! : (p.loveLanguages || []));
    })();
  }, []);

  if (!prefs) {
    return (
      <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1, padding: 20 }}>
          <Text style={{ color: "#fff" }}>Loading…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const toggleLL = (list: LoveLang[], setList: (v: LoveLang[]) => void, t: LoveLang) => {
    const cur = new Set(list);
    cur.has(t) ? cur.delete(t) : cur.add(t);
    setList(Array.from(cur) as LoveLang[]);
  };

  const saveAll = async () => {
    const names = kidsCSV.split(",").map(s => s.trim()).filter(Boolean);
    const kids = names.map((n, i) => ({ id: `k${i+1}`, name: n }));
    const next: Prefs = {
      ...prefs,
      profiles: { spouse: { name: spouseName || "Spouse" }, kids },
      spouseLoveLanguages: spouseLL,
      kidsLoveLanguages: Object.fromEntries(kids.map(k => [k.id, kidsLL])),
      remindAt: remindAt || "08:00",
    };
    setPrefs(next);
    await savePrefs(next);
    if (Platform.OS !== "web" && next.remindAt) {
      const [h, m] = next.remindAt.split(":").map(Number);
      await scheduleDailyLocal(h, m);
    }
    Alert.alert("Saved", "Preferences updated and reminder rescheduled.");
  };

  return (
    <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Reminder</Text>
          <Text style={styles.helper}>24h format, e.g. 08:00 or 21:15</Text>
          <TextInput value={remindAt} onChangeText={setRemindAt} placeholder="08:00" placeholderTextColor="#6b5a9d" keyboardType="numbers-and-punctuation" style={styles.input} />
          <View style={styles.rowChips}>
            {["07:30","08:00","12:00","18:00","21:00"].map(t => (
              <Chip key={t} label={t} selected={remindAt===t} onPress={()=>setRemindAt(t)} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Names</Text>
          <Text style={styles.helper}>Used in copy and notifications</Text>
          <TextInput value={spouseName} onChangeText={setSpouseName} placeholder="Spouse" placeholderTextColor="#6b5a9d" style={styles.input} />
          <Text style={[styles.helper, { marginTop: 10 }]}>Kids (comma-separated)</Text>
          <TextInput value={kidsCSV} onChangeText={setKidsCSV} placeholder="Ella, Noah" placeholderTextColor="#6b5a9d" style={styles.input} />
        </View>

        <View style={styles.rowTwo}>
          <View style={[styles.card, styles.cardHalf]}>
            <Text style={styles.cardTitle}>Time Budget</Text>
            <View style={styles.rowChips}>
              {DUR.map(t => <Chip key={t} label={t} selected={prefs.timeBudget===t} onPress={()=>setPrefs({ ...prefs, timeBudget: t })} />)}
            </View>
          </View>
          <View style={[styles.card, styles.cardHalf]}>
            <Text style={styles.cardTitle}>Money Budget</Text>
            <View style={styles.rowChips}>
              {MONEY.map(b => <Chip key={b} label={b.replace("budget:","$ ")} selected={prefs.moneyBudget===b} onPress={()=>setPrefs({ ...prefs, moneyBudget: b })} />)}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spouse — Love Languages</Text>
          <View style={styles.rowChipsWrap}>
            {ALL_LL.map(tag => <Chip key={tag} label={tag} selected={spouseLL.includes(tag)} onPress={()=>toggleLL(spouseLL, setSpouseLL, tag)} />)}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Children — Love Languages</Text>
          <Text style={styles.helper}>Applied to all children for now</Text>
          <View style={styles.rowChipsWrap}>
            {ALL_LL.map(tag => <Chip key={tag} label={tag} selected={kidsLL.includes(tag)} onPress={()=>toggleLL(kidsLL, setKidsLL, tag)} />)}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Faith Mode</Text>
            <Switch value={prefs.faithMode} onValueChange={(v)=>setPrefs({ ...prefs, faithMode: v })} />
          </View>
          <Text style={styles.helper}>Show a short verse when available.</Text>
        </View>

        <Pressable style={styles.saveBtn} onPress={saveAll}>
          <Text style={styles.saveText}>Save & Reschedule Reminder</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipActive]}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 20 },
  heading: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  card: { borderRadius: 22, padding: 14, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.28)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", ...shadow(10) },
  cardHalf: { flex: 1 },
  rowTwo: { flexDirection: "row", gap: 12, marginBottom: 12 },
  cardTitle: { color: "#1f163a", fontWeight: "800", marginBottom: 6 },
  helper: { color: "#6b5a9d", marginBottom: 8 },
  input: { color: "#1a1330", backgroundColor: "rgba(255,255,255,0.92)", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, fontWeight: "700" },
  rowChips: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  rowChipsWrap: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  chipActive: { backgroundColor: "rgba(255,255,255,0.65)" },
  chipText: { color: "#362b56", fontWeight: "700" },
  chipTextActive: { color: "#1f163a" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  saveBtn: { marginTop: 6, paddingVertical: 14, borderRadius: 16, alignItems: "center", backgroundColor: "#22c55e", ...shadow(8) },
  saveText: { color: "#000", fontWeight: "800" },
});

function shadow(elevation: number) {
  return Platform.select({
    android: { elevation },
    ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: elevation, shadowOffset: { width: 0, height: Math.ceil(elevation / 2) } },
    default: {},
  });
}
