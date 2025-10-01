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
import { enablePush } from "../../lib/push";
import { useBreakpoints } from "../../lib/responsive";
import { loadPrefs, savePrefs } from "../../lib/storage";
import { ensureWebPushSubscription } from "../../lib/webpush";
import { Prefs } from "../../types";

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
  const [status, setStatus] = useState<string>("");

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
        } catch (err) {
          console.warn("web push init failed", err);
        }
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

    let remindAt = prefs.remindAt || "08:00";
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(remindAt);
    if (!m) {
      Alert.alert("Reminder time", "Please use HH:mm (24h) format, e.g. 08:00 or 19:30.");
      return;
    }

    await savePrefs({ ...prefs, remindAt });

    try {
      if (Platform.OS === "web") {
        await ensureWebPushSubscription(remindAt);
        const perm = (Notification && Notification.permission) || "default";
        if (perm === "granted" || perm === "denied" || perm === "default") {
          setWebPushPermission(perm);
        }
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = await reg?.pushManager.getSubscription();
          setWebPushSubscribed(!!sub);
        }
      } else {
        await ensureNotiPermissions();
        const [h, mm] = remindAt.split(":").map(Number);
        try {
          await cancelAllLocal();
        } catch {}
        await scheduleDailyLocal(h, mm);
      }
      setStatus(`Settings saved at ${dayjs().format("h:mm A")}`);
      Alert.alert("Saved", "Your preferences have been updated.");
    } catch (err: any) {
      setStatus(err?.message || "Failed to update notifications");
      Alert.alert("Oops", err?.message || "Failed to update notifications.");
    }
  };

  const handleEnablePush = async () => {
    if (Platform.OS !== "web") {
      setStatus("Push notifications are available on web. Open Love Today in your browser and install to Home Screen.");
      Alert.alert("Heads up", "Push notifications are available on web. Open Love Today in your browser and install to Home Screen.");
      return;
    }
    try {
      await enablePush();
      setStatus("Web push enabled. You will receive daily reminders.");
      Alert.alert("Enabled", "Web push notifications are enabled.");
    } catch (err: any) {
      setStatus(err?.message || "Failed to enable web push");
      Alert.alert("Oops", err?.message || "Failed to enable web push.");
    }
  };

  if (!prefs) {
    return (
      <LinearGradient colors={["#05070f", "#0a1326", "#111f3a"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#05070f", "#0a1326", "#111f3a"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: 1180,
            alignSelf: "center",
            paddingHorizontal: bp.containerPad,
            paddingTop: 20,
            paddingBottom: 64,
            gap: 18,
          }}
        >
          <LinearGradient
            colors={["rgba(124,245,255,0.18)", "rgba(98,117,255,0.12)", "rgba(10,18,36,0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Settings</Text>
              <Text style={styles.subheading}>Tune the prompts, budgets, and reminders that help you show up every day.</Text>
            </View>
            <View style={styles.reminderBadge}>
              <Ionicons name="time-outline" size={18} color="#050b18" />
              <Text style={styles.reminderBadgeText}>{prefs.remindAt || "--:--"}</Text>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profiles</Text>
            <Text style={styles.label}>Spouse name</Text>
            <TextInput
              value={prefs.profiles?.spouse?.name || ""}
              onChangeText={setSpouseName}
              placeholder="Enter a name"
              style={styles.input}
              placeholderTextColor="#6d7aa6"
            />

            <View style={styles.kidHeader}>
              <Text style={styles.label}>Children</Text>
              <Pressable onPress={addKid} style={styles.addKidBtn}>
                <Ionicons name="add" size={16} color="#050b18" />
                <Text style={styles.addKidText}>Add child</Text>
              </Pressable>
            </View>

            <View style={{ gap: 10 }}>
              {kids.length === 0 ? (
                <Text style={styles.muted}>No children added yet.</Text>
              ) : (
                kids.map((kid) => (
                  <View key={kid.id} style={styles.kidRow}>
                    <TextInput
                      value={kid.name}
                      onChangeText={(name) => setKidName(kid.id, name)}
                      placeholder="Name"
                      style={[styles.input, { flex: 1 }]}
                      placeholderTextColor="#6d7aa6"
                    />
                    <Pressable onPress={() => removeKid(kid.id)} style={styles.removeKidBtn}>
                      <Ionicons name="trash" size={16} color="#fca5a5" />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Love languages</Text>
            <View style={styles.chipRow}>
              {LANGS.map((lang) => {
                const active = prefs.loveLanguages?.includes(lang.id as any);
                return (
                  <Pressable
                    key={lang.id}
                    onPress={() => toggleLang(lang.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            <Text style={styles.label}>Time budget</Text>
            <TextInput
              value={prefs.timeBudget || ""}
              onChangeText={(v) => update("timeBudget", v as any)}
              placeholder="e.g. 15min, 30min"
              style={styles.input}
              placeholderTextColor="#6d7aa6"
            />

            <Text style={styles.label}>Money budget</Text>
            <TextInput
              value={prefs.moneyBudget || ""}
              onChangeText={(v) => update("moneyBudget", v as any)}
              placeholder="e.g. budget:$, budget:$$"
              style={styles.input}
              placeholderTextColor="#6d7aa6"
            />

            <Pressable onPress={() => update("faithMode", !prefs.faithMode as any)} style={[styles.toggle, prefs.faithMode && styles.toggleActive]}>
              <View style={[styles.toggleDot, prefs.faithMode && styles.toggleDotActive]} />
              <Text style={[styles.toggleLabel, prefs.faithMode && styles.toggleLabelActive]}>
                Faith mode {prefs.faithMode ? "on" : "off"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Daily reminder</Text>
              <Pressable onPress={handleEnablePush} style={styles.smallGhostBtn}>
                <Ionicons name="notifications-outline" size={14} color="#8ba2d6" />
                <Text style={styles.smallGhostText}>Enable push</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Time (24h)</Text>
            <TextInput
              value={prefs.remindAt || ""}
              onChangeText={(v) => update("remindAt", v as any)}
              placeholder="HH:mm"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
              placeholderTextColor="#6d7aa6"
            />

            {showWebPushRow ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.label}>Web push status</Text>
                <View style={styles.webRow}>
                  <View style={[styles.statusPill, pillStyle(webPushPermission, webPushSubscribed)]}>
                    <Text style={styles.statusText}>
                      {webPushPermission === "granted"
                        ? webPushSubscribed
                          ? "Subscribed"
                          : "Granted (not subscribed)"
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
                        setStatus("Web push is ready to go.");
                        Alert.alert("Ready", "Web push is set up.");
                      } catch (e: any) {
                        setStatus(e?.message || "Failed to configure web push");
                        Alert.alert("Oops", e?.message ?? "Failed to configure web push.");
                      }
                    }}
                    style={styles.webBtn}
                  >
                    <Ionicons name="refresh-outline" size={14} color="#050b18" />
                    <Text style={styles.webBtnText}>Refresh status</Text>
                  </Pressable>
                </View>
                <Text style={styles.tip}>iPhone or iPad: install to Home Screen to receive pushes in the background.</Text>
              </View>
            ) : (
              <Text style={styles.tip}>Local notifications will be scheduled on this device.</Text>
            )}
          </View>

          <Pressable onPress={saveAll} style={styles.saveBtn}>
            <Ionicons name="save-outline" size={18} color="#050b18" />
            <Text style={styles.saveText}>Save settings</Text>
          </Pressable>

          <View style={styles.footerWrap}>
            <Text style={styles.footerText}>Last updated {dayjs().format("MMM D, YYYY - h:mm A")}</Text>
            {status ? <Text style={styles.status}>{status}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function pillStyle(perm: "granted" | "denied" | "default", subscribed: boolean) {
  if (perm === "granted" && subscribed) return { backgroundColor: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.4)" };
  if (perm === "granted") return { backgroundColor: "rgba(250,204,21,0.2)", borderColor: "rgba(250,204,21,0.4)" };
  if (perm === "denied") return { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.4)" };
  return { backgroundColor: "rgba(148,163,184,0.2)", borderColor: "rgba(148,163,184,0.4)" };
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#cbd5f5", fontSize: 16 },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.28)",
    padding: 24,
    gap: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  heading: { color: "#f8fbff", fontSize: 26, fontWeight: "800" },
  subheading: { color: "#aab8e5", lineHeight: 20 },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#7cf5ff",
  },
  reminderBadgeText: { color: "#050b18", fontWeight: "700" },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.24)",
    backgroundColor: "rgba(12,20,40,0.88)",
    padding: 22,
    gap: 14,
  },
  cardTitle: { color: "#f1f5ff", fontWeight: "800", fontSize: 18 },
  label: { color: "#8ba2d6", fontWeight: "700", marginBottom: 6 },
  muted: { color: "#6d7aa6", fontStyle: "italic" },
  input: {
    backgroundColor: "rgba(15,24,44,0.82)",
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.24)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#f1f5ff",
  },
  kidHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kidRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addKidBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#7cf5ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addKidText: { color: "#050b18", fontWeight: "700" },
  removeKidBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.16)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(14,22,40,0.8)",
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.22)",
  },
  chipActive: { backgroundColor: "#7cf5ff", borderColor: "#7cf5ff" },
  chipText: { color: "#8ba2d6", fontWeight: "700" },
  chipTextActive: { color: "#050b18", fontWeight: "700" },

  toggle: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15,24,44,0.8)",
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.22)",
  },
  toggleActive: { backgroundColor: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.4)" },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#4b5c87" },
  toggleDotActive: { backgroundColor: "#22c55e" },
  toggleLabel: { color: "#f1f5ff", fontWeight: "700" },
  toggleLabelActive: { color: "#0b141f" },

  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  smallGhostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.28)",
    backgroundColor: "rgba(14,24,40,0.8)",
  },
  smallGhostText: { color: "#8ba2d6", fontSize: 12, fontWeight: "700" },

  webRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { color: "#f1f5ff", fontWeight: "700" },
  webBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#7cf5ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  webBtnText: { color: "#050b18", fontWeight: "700" },
  tip: { color: "#6d7aa6", fontSize: 12 },

  saveBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#7cf5ff",
  },
  saveText: { color: "#050b18", fontWeight: "800" },

  footerWrap: { gap: 6 },
  footerText: { color: "#6d7aa6", fontSize: 12 },
  status: { color: "#8ba2d6", fontSize: 12 },
});
