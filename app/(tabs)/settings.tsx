import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cancelAllLocal, ensureNotiPermissions, scheduleDailyLocal } from "../../lib/notify";
import { useBreakpoints } from "../../lib/responsive";
import { loadPrefs, savePrefs } from "../../lib/storage";
import { ensureWebPushSubscription } from "../../lib/webpush";
import { Prefs } from "../../types";

/** For love languages multi-select */
const LANGS = [
  { id: "words", label: "Words" },
  { id: "time", label: "Quality Time" },
  { id: "service", label: "Acts of Service" },
  { id: "gifts", label: "Gifts" },
  { id: "touch", label: "Touch" },
] as const;

export default function Settings() {
  const bp = useBreakpoints();
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  // Web Push status (web only)
  const [webPushPermission, setWebPushPermission] = useState<"granted" | "denied" | "default">("default");
  const [webPushSubscribed, setWebPushSubscribed] = useState<boolean>(false);
  const showWebPushRow = Platform.OS === "web";

  useEffect(() => {
    (async () => {
      const p = await loadPrefs();
      if (p) setPrefs(p);

      if (Platform.OS !== "web") {
        await ensureNotiPermissions();
      } else {
        // read current web permission and subscription state
        try {
          const perm = (Notification && Notification.permission) || "default";
          if (perm === "granted" || perm === "denied" || perm === "default") {
            setWebPushPermission(perm);
          }
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            const sub = await reg?.pushManager.getSubscription();
            setWebPushSubscribed(!!sub);
          }
        } catch {}
      }
    })();
  }, []);

  const kids = useMemo(() => prefs?.profiles?.kids ?? [], [prefs]);

  const update = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((p) => (p ? { ...p, [key]: value } : p));

  const setSpouseName = (name: string) =>
    setPrefs((p) => (p ? { ...p, profiles: { ...p.profiles, spouse: { name } } } : p));

  const setKidName = (id: string, name: string) =>
    setPrefs((p) =>
      p
        ? {
            ...p,
            profiles: {
              ...p.profiles,
              kids: (p.profiles?.kids || []).map((k) => (k.id === id ? { ...k, name } : k)),
            },
          }
        : p
    );

  const addKid = () =>
    setPrefs((p) =>
      p
        ? {
            ...p,
            profiles: {
              ...p.profiles,
              kids: [...(p.profiles?.kids || []), { id: `k_${Date.now()}`, name: "" }],
            },
          }
        : p
    );

  const removeKid = (id: string) =>
    setPrefs((p) =>
      p
        ? {
            ...p,
            profiles: {
              ...p.profiles,
              kids: (p.profiles?.kids || []).filter((k) => k.id !== id),
            },
          }
        : p
    );

  const toggleLang = (id: (typeof LANGS)[number]["id"]) =>
    setPrefs((p) => {
      if (!p) return p;
      const has = p.loveLanguages?.includes(id) ?? false;
      const next = has ? (p.loveLanguages || []).filter((x) => x !== id) : [...(p.loveLanguages || []), id];
      return { ...p, loveLanguages: next };
    });

  const saveAll = async () => {
    if (!prefs) return;

    // Normalize reminder time to HH:mm
    let remindAt = prefs.remindAt || "08:00";
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(remindAt);
    if (!m) {
      Alert.alert("Reminder time", "Please use HH:mm (24h) format, e.g. 08:00 or 19:30.");
      return;
    }

    await savePrefs({ ...prefs, remindAt });

    // Notifications
    if (Platform.OS === "web") {
      try {
        await ensureWebPushSubscription(remindAt);
        // refresh indicators
        const perm = (Notification && Notification.permission) || "default";
        if (perm === "granted" || perm === "denied" || perm === "default") {
          setWebPushPermission(perm);
        }
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = await reg?.pushManager.getSubscription();
          setWebPushSubscribed(!!sub);
        }
      } catch (e: any) {
        console.warn("web push subscribe failed", e?.message);
      }
    } else {
      await ensureNotiPermissions();
      const [h, mm] = remindAt.split(":").map(Number);
      // optional: clear + reschedule
      try { await cancelAllLocal(); } catch {}
      await scheduleDailyLocal(h, mm);
    }

    Alert.alert("Saved", "Your preferences have been updated.");
  };

  if (!prefs) {
    return (
      <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ padding: 18 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>Loading…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30, paddingTop: 10 }}>
          <Text style={styles.heading}>Settings</Text>

          {/* Names */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profiles</Text>

            <Text style={styles.label}>Spouse’s name</Text>
            <TextInput
              value={prefs.profiles?.spouse?.name || ""}
              onChangeText={setSpouseName}
              placeholder="e.g., Emily"
              style={styles.input}
              placeholderTextColor="#7c6ea8"
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Children</Text>
            {kids.map((k) => (
              <View key={k.id} style={styles.kidRow}>
                <TextInput
                  value={k.name}
                  onChangeText={(t) => setKidName(k.id, t)}
                  placeholder="Child’s name"
                  style={[styles.input, { flex: 1 }]}
                  placeholderTextColor="#7c6ea8"
                />
                <Pressable onPress={() => removeKid(k.id)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={16} color="#1f163a" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={addKid} style={[styles.pillBtn, { marginTop: 8 }]}>
              <Ionicons name="add" size={16} color="#1f163a" />
              <Text style={styles.pillText}>Add a child</Text>
            </Pressable>
          </View>

          {/* Love languages */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Love Languages</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {LANGS.map((l) => {
                const active = prefs.loveLanguages?.includes(l.id as any);
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => toggleLang(l.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{l.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Budgets & faith */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>

            <Text style={styles.label}>Time budget</Text>
            <TextInput
              value={prefs.timeBudget || ""}
              onChangeText={(v) => update("timeBudget", v as any)}
              placeholder="e.g., 15min, 30min"
              style={styles.input}
              placeholderTextColor="#7c6ea8"
            />

            <Text style={styles.label}>Money budget</Text>
            <TextInput
              value={prefs.moneyBudget || ""}
              onChangeText={(v) => update("moneyBudget", v as any)}
              placeholder="e.g., budget:$, budget:$$"
              style={styles.input}
              placeholderTextColor="#7c6ea8"
            />

            <View style={{ height: 10 }} />

            <Pressable
              onPress={() => update("faithMode", !prefs.faithMode as any)}
              style={[styles.switchRow, prefs.faithMode && styles.switchOn]}
            >
              <View style={[styles.switchDot, prefs.faithMode && styles.switchDotOn]} />
              <Text style={styles.switchLabel}>
                Faith mode {prefs.faithMode ? "On" : "Off"}
              </Text>
            </Pressable>
          </View>

          {/* Notifications */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Reminder</Text>

            <Text style={styles.label}>Time (24h)</Text>
            <TextInput
              value={prefs.remindAt || ""}
              onChangeText={(v) => update("remindAt", v as any)}
              placeholder="HH:mm (e.g., 08:00)"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
              placeholderTextColor="#7c6ea8"
            />

            {showWebPushRow ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>Web Push</Text>
                <View style={styles.webRow}>
                  <View style={[styles.statusPill, pillStyle(webPushPermission, webPushSubscribed)]}>
                    <Text style={styles.statusText}>
                      {webPushPermission === "granted"
                        ? webPushSubscribed ? "Subscribed ✓" : "Granted (not subscribed)"
                        : webPushPermission === "denied"
                        ? "Denied"
                        : "Not requested"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={async () => {
                      try {
                        await ensureWebPushSubscription(prefs.remindAt || "08:00");
                        const perm = (Notification && Notification.permission) || "default";
                        if (perm === "granted" || perm === "denied" || perm === "default") {
                          setWebPushPermission(perm);
                        }
                        const reg = await navigator.serviceWorker.getRegistration();
                        const sub = await reg?.pushManager.getSubscription();
                        setWebPushSubscribed(!!sub);
                        Alert.alert("Ready", "Web Push is set up!");
                      } catch (e: any) {
                        Alert.alert("Oops", e?.message ?? "Failed to set up web push.");
                      }
                    }}
                    style={[styles.pillBtn, { backgroundColor: "rgba(96,165,250,0.25)" }]}
                  >
                    <Ionicons name="notifications" size={16} color="#1f163a" />
                    <Text style={styles.pillText}>Enable Web Push</Text>
                  </Pressable>
                </View>
                <Text style={styles.webHint}>
                  iPhone/iPad: install to Home Screen to receive pushes in the background.
                </Text>
              </View>
            ) : (
              <Text style={{ color: "#6b5a9d", marginTop: 8 }}>
                Local notifications will be scheduled on your device.
              </Text>
            )}
          </View>

          <Pressable onPress={saveAll} style={[styles.saveBtn, { backgroundColor: "#22c55e" }]}>
            <Text style={styles.saveText}>Save Settings</Text>
          </Pressable>

          <Text style={styles.footer}>
            Last updated {dayjs().format("MMM D, YYYY • h:mm A")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------- helpers ---------- */

function pillStyle(perm: "granted" | "denied" | "default", subscribed: boolean) {
  if (perm === "granted" && subscribed) return { backgroundColor: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.4)" };
  if (perm === "granted") return { backgroundColor: "rgba(250,204,21,0.2)", borderColor: "rgba(250,204,21,0.4)" };
  if (perm === "denied") return { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" };
  return { backgroundColor: "rgba(148,163,184,0.2)", borderColor: "rgba(148,163,184,0.4)" };
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  heading: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  card: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    marginBottom: 12,
  },
  cardTitle: { color: "#1a1330", fontWeight: "800", fontSize: 18, marginBottom: 8 },

  label: { color: "#6b5a9d", fontWeight: "700", marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#1a1330",
  },

  kidRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },

  chip: {
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  chipActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  chipText: { color: "#2b2342", fontWeight: "700" },
  chipTextActive: { color: "#1f163a", fontWeight: "800" },

  switchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 999, padding: 6,
  },
  switchOn: { backgroundColor: "rgba(34,197,94,0.18)" },
  switchDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#94a3b8" },
  switchDotOn: { backgroundColor: "#22c55e" },
  switchLabel: { color: "#1f163a", fontWeight: "800" },

  pillBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999,
    alignSelf: "flex-start",
  },
  pillText: { color: "#1f163a", fontWeight: "800" },

  webRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  statusPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { color: "#1f163a", fontWeight: "800" },
  webHint: { color: "#6b5a9d", marginTop: 8 },

  saveBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
    }),
  },
  saveText: { color: "#0b132b", fontWeight: "900" },

  footer: { color: "#fff", textAlign: "center", opacity: 0.9, marginTop: 8 },
});
