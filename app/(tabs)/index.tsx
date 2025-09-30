import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addMoment } from "../../lib/moments";
import { ensureNotiPermissions, scheduleDailyLocal } from "../../lib/notify";
import { pickIdea } from "../../lib/picker";
import { useBreakpoints } from "../../lib/responsive";
import { loadPrefs, updateHistory } from "../../lib/storage";
import { loadStreak, tickStreak } from "../../lib/streaks";
import { renderIdeaText } from "../../lib/text";
import { Idea, Prefs, Recipient } from "../../types";

// web push: import dynamically so native builds don't choke on /src/push
async function enableWebPush() {
  if (Platform.OS !== "web") return "Available on web only";
  const mod = await import("../../src/push"); // ensure this file exists
  await mod.enablePush();
  return "Enabled! You’ll get daily web notifications.";
}

export default function Today() {
  const bp = useBreakpoints();

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [recipient, setRecipient] = useState<Recipient>("spouse");
  const [kidId, setKidId] = useState<string | undefined>(undefined);
  const [streakCurrent, setStreakCurrent] = useState<number>(0);
  const [status, setStatus] = useState<string>("");

  // Initial load
  useEffect(() => {
    (async () => {
      await ensureNotiPermissions();

      let p = (await loadPrefs()) ?? undefined;
      if (!p || !p.remindAt) {
        p = {
          profiles: { spouse: { name: "Spouse" }, kids: [{ id: "k1", name: "Kiddo" }] },
          loveLanguages: ["time", "words"],
          timeBudget: "15min",
          moneyBudget: "budget:$",
          faithMode: false,
          remindAt: "08:00",
          lastShownIds: [],
        } as Prefs;
      }
      setPrefs(p);

      // Native: schedule local daily reminder at chosen time
      if (Platform.OS !== "web" && p.remindAt) {
        const [h, m] = p.remindAt.split(":").map(Number);
        await scheduleDailyLocal(h, m);
      }

      setIdea(pickIdea(p, recipient, kidId));

      const s = await loadStreak();
      setStreakCurrent(s.current);
    })();
  }, []);

  // Re-pick idea when recipient/kid changes
  useEffect(() => {
    if (prefs) setIdea(pickIdea(prefs, recipient, kidId));
  }, [recipient, kidId]);

  const refresh = async () => {
    if (!prefs) return;
    setIdea(pickIdea(prefs, recipient, kidId));
  };

  const markDone = async () => {
    if (!idea) return;
    await updateHistory(idea.id);
    const s = await tickStreak(); // update streak
    setStreakCurrent(s.current);
    await refresh();
    Alert.alert("Nice!", "Logged for today. Streak updated 🔥");
  };

  /** Save picked/taken photo as a Moment */
  const savePickedMoment = async (uri: string) => {
    if (!prefs || !idea) return;
    const text = renderIdeaText(idea, prefs, { kidId });
    await addMoment({
      ideaId: idea.id,
      recipient,
      kidId,
      text,
      photoTempUri: uri,
    });
    Alert.alert("Saved", "Added to your Family Moments.");
  };

  /** Take a new photo */
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera permission needed", "Please allow camera access or use Library.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) await savePickedMoment(result.assets[0].uri);
  };

  /** Choose from library */
  const chooseFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission needed", "Please allow Photos access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) await savePickedMoment(result.assets[0].uri);
  };

  const kids = prefs?.profiles?.kids ?? [];
  const remindAt = useMemo(() => prefs?.remindAt ?? "08:00", [prefs]);

  const onEnableWebPush = async () => {
    try {
      setStatus("Enabling web notifications…");
      const msg = await enableWebPush();
      setStatus(msg);
    } catch (e: any) {
      setStatus(e?.message || "Failed to enable web notifications");
    }
  };

  // Render loading
  if (!prefs || !idea) {
    return (
      <LinearGradient colors={["#0b0b12", "#131326"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: bp.containerPad, paddingTop: 20 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>Loading…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0b0b12", "#0e0e18", "#10101b"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: 1160,
            alignSelf: "center",
            paddingHorizontal: bp.containerPad,
            paddingTop: 14,
            paddingBottom: 56,
            rowGap: bp.gap + 6,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* NAV / HEADER */}
          <View style={styles.nav}>
            <View style={styles.brand}>
              <View style={styles.brandLogo}>
                <Text style={{ color: "#fff" }}>❤</Text>
              </View>
              <Text style={styles.brandText}>Love Today</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {/* Streak */}
              <View style={styles.streakBadge}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakText}>{streakCurrent}</Text>
              </View>
              {/* Menu icon */}
              <Pressable style={styles.iconBtn}>
                <Ionicons name="menu" size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {/* HERO CARD */}
          <View style={[styles.heroCard, { borderRadius: bp.radius + 4 }]}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.heroKicker}>Daily nudge</Text>
              <Text style={[styles.heroTitle, { fontSize: bp.titleSize }]}>
                Small acts, big heart.
              </Text>
              <Text style={styles.heroSub}>
                Get one practical idea each day. Log it. Build a streak.
              </Text>

              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                {Platform.OS === "web" ? (
                  <Pressable onPress={onEnableWebPush} style={[styles.ctaSolid, styles.ctaGlow]}>
                    <Ionicons name="notifications" size={16} color="#0b0b12" />
                    <Text style={styles.ctaSolidText}>Enable web notifications</Text>
                  </Pressable>
                ) : (
                  <View style={[styles.ctaMuted]}>
                    <Ionicons name="notifications" size={16} color="#9ca3af" />
                    <Text style={styles.ctaMutedText}>Daily local reminders at {remindAt}</Text>
                  </View>
                )}
              </View>

              {status ? <Text style={styles.status}>{status}</Text> : null}
            </View>

            <View style={styles.heroPreview}>
              <View style={styles.phoneShell}>
                <View style={styles.phoneTop} />
                <View style={styles.phoneInner}>
                  <Text style={styles.previewLabel}>Today</Text>
                  <Text style={styles.previewIdea}>
                    Send a kind text to someone you haven’t checked on in a while.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* SEGMENTS */}
          <View
            style={[
              styles.segmentWrap,
              { flexDirection: bp.isMobile ? "column" : "row", gap: bp.gap },
            ]}
          >
            <Segment
              label="For Spouse"
              active={recipient === "spouse"}
              onPress={() => setRecipient("spouse")}
              style={{ flex: bp.isMobile ? 0 : 1, width: bp.isMobile ? "100%" : undefined }}
            />
            <Segment
              label="For Children"
              active={recipient === "kid"}
              onPress={() => setRecipient("kid")}
              style={{ flex: bp.isMobile ? 0 : 1, width: bp.isMobile ? "100%" : undefined }}
            />
            <Segment
              label="For Family"
              active={recipient === "family"}
              onPress={() => setRecipient("family")}
              style={{ flex: bp.isMobile ? 0 : 1, width: bp.isMobile ? "100%" : undefined }}
            />
          </View>

          {/* KID SELECTOR */}
          {recipient === "kid" && kids.length > 0 && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: -4, marginBottom: 6, flexWrap: "wrap" }}>
              {kids.map((k) => (
                <Pressable
                  key={k.id}
                  onPress={() => setKidId(k.id)}
                  style={[styles.kidPill, kidId === k.id && styles.kidPillActive]}
                >
                  <Text style={[styles.kidPillText, kidId === k.id && styles.kidPillTextActive]}>{k.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* IMAGE GRID */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bp.gap }}>
            <GlassCard
              title="For Spouse"
              image={require("../../assets/ui/spouse.png")}
              widthPct={bp.cols === 3 ? "32%" : bp.cols === 2 ? "48%" : "100%"}
            />
            <GlassCard
              title="For Children"
              image={require("../../assets/ui/kids.png")}
              widthPct={bp.cols === 3 ? "32%" : bp.cols === 2 ? "48%" : "100%"}
            />
            <GlassCard
              title="For Family"
              image={require("../../assets/ui/family.png")}
              widthPct={bp.cols === 3 ? "32%" : bp.cols === 2 ? "48%" : "100%"}
            />
          </View>

          {/* TODAY CARD */}
          <View style={[styles.todayCard, { borderRadius: bp.radius }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={styles.todayLabel}>Today’s Idea • {dayjs().format("MMM D")}</Text>
              {/* (Optional) time chip – shows remindAt */}
              <View style={styles.timeChip}>
                <Ionicons name="time-outline" size={12} color="#6b5a9d" />
                <Text style={styles.timeChipText}>{remindAt}</Text>
              </View>
            </View>

            <Text style={[styles.todayText, { fontSize: bp.bodySize + 2 }]}>
              {renderIdeaText(idea, prefs, { kidId })}
            </Text>

            {prefs.faithMode && idea.faith && (
              <Text style={styles.verse}>
                {idea.faith.verse} — {idea.faith.ref}
              </Text>
            )}

            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Pressable style={[styles.cta, { backgroundColor: "#22c55e" }]} onPress={markDone}>
                <Text style={styles.ctaTextDark}>Done</Text>
              </Pressable>
              <Pressable style={[styles.cta, { backgroundColor: "#eab308" }]} onPress={refresh}>
                <Text style={styles.ctaTextDark}>Swap</Text>
              </Pressable>
              <Pressable style={[styles.cta, { backgroundColor: "#60a5fa" }]} onPress={takePhoto}>
                <Text style={styles.ctaTextDark}>Take Photo</Text>
              </Pressable>
              <Pressable style={[styles.cta, { backgroundColor: "#a78bfa" }]} onPress={chooseFromLibrary}>
                <Text style={styles.ctaTextDark}>Choose Photo</Text>
              </Pressable>
            </View>

            {Platform.OS === "web" && (
              <Text style={{ color: "#8b8ea3", marginTop: 8 }}>
                Tip: On iPhone, install to Home Screen to receive web push.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------- Small UI components ---------- */

function Segment({
  label,
  active,
  onPress,
  style,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: any;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive, style]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function GlassCard({
  title,
  image,
  widthPct,
}: {
  title: string;
  image: any;
  widthPct: string;
}) {
  const { height } = useWindowDimensions();
  const imgH = Math.max(120, Math.min(260, Math.floor(height * 0.2)));

  return (
    <View style={[styles.glassCard, { width: widthPct }]}>
      <Image
        source={image}
        style={{ width: "100%", height: imgH, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" }}
        resizeMode="cover"
      />
      <Text numberOfLines={1} style={styles.glassTitle}>
        {title}
      </Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  brandText: { color: "#fff", fontWeight: "800", letterSpacing: 0.3 },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  streakFlame: { fontSize: 14, color: "#fff" },
  streakText: { color: "#fff", fontWeight: "800" },

  heroCard: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    gap: 14,
  },
  heroKicker: { color: "#cbd5e1", fontWeight: "700", letterSpacing: 0.3, fontSize: 12 },
  heroTitle: { color: "#fff", fontWeight: "800" },
  heroSub: { color: "#aeb3c7" },

  heroPreview: { minWidth: 220, alignItems: "center", justifyContent: "center" },
  phoneShell: {
    width: 220,
    borderRadius: 22,
    backgroundColor: "#06060a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 10,
  },
  phoneTop: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  phoneInner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    gap: 6,
  },
  previewLabel: { color: "#a3a8c2", fontSize: 12, fontWeight: "700" },
  previewIdea: { color: "#fff", fontWeight: "700" },

  segmentWrap: {},
  segment: {
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  segmentActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  segmentText: { color: "#e5e7eb", fontWeight: "700" },
  segmentTextActive: { color: "#fff" },

  kidPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  kidPillActive: { backgroundColor: "rgba(255,255,255,0.24)" },
  kidPillText: { color: "#e5e7eb", fontWeight: "700" },
  kidPillTextActive: { color: "#fff" },

  glassCard: {
    borderRadius: 18,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  glassTitle: { color: "#e5e7eb", fontWeight: "700", marginTop: 8 },

  todayCard: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  todayLabel: { color: "#6b5a9d", fontWeight: "700" },
  todayText: { color: "#101018", fontWeight: "800", marginTop: 6, marginBottom: 8 },
  verse: { color: "#2f855a", marginBottom: 12 },

  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(107,90,157,0.10)",
  },
  timeChipText: { color: "#6b5a9d", fontWeight: "700", fontSize: 12 },

  row: { flexDirection: "row", gap: 10 },
  cta: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  ctaTextDark: { color: "#000", fontWeight: "800" },

  ctaSolid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#7cf5ff",
  },
  ctaGlow: {
    shadowColor: "#00e0ff",
    ...(Platform.OS === "android"
      ? { elevation: 10 }
      : {
          shadowOpacity: 0.35,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
        }),
  },
  ctaSolidText: { color: "#0b0b12", fontWeight: "800" },

  ctaMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  ctaMutedText: { color: "#9ca3af", fontWeight: "800" },

  status: { color: "#a3a8c2", marginTop: 6, fontSize: 12 },
});
