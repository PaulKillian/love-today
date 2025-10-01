import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const mod = await import("../../lib/push");
  await mod.enablePush();
  return "Enabled! You'll get daily web notifications.";
}

export default function Today() {
  const bp = useBreakpoints();

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [recipient, setRecipient] = useState<Recipient>("spouse");
  const [kidId, setKidId] = useState<string | undefined>(undefined);
  const [streakCurrent, setStreakCurrent] = useState<number>(0);
  const [ideaCompleted, setIdeaCompleted] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

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

      if (Platform.OS !== "web" && p.remindAt) {
        const [h, m] = p.remindAt.split(":").map(Number);
        await scheduleDailyLocal(h, m);
      }

      setIdeaCompleted(false);

      setIdea(pickIdea(p, recipient, kidId));

      const s = await loadStreak();
      setStreakCurrent(s.current);
    })();
  }, []);

  useEffect(() => {
    if (prefs) {
      setIdeaCompleted(false);
      setIdea(pickIdea(prefs, recipient, kidId));
    }
  }, [recipient, kidId, prefs]);

  const refresh = async () => {
    if (!prefs) return;
    setIdeaCompleted(false);
    setIdea(pickIdea(prefs, recipient, kidId));
  };

  const markDone = async () => {
    if (!idea) return;
    await updateHistory(idea.id);
    const s = await tickStreak();
    setStreakCurrent(s.current);
    setIdeaCompleted(true);
    Alert.alert("Nice!", "Logged for today. Streak updated!");
  };

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

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera permission needed", "Please allow camera access or use Library.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) await savePickedMoment(result.assets[0].uri);
  };

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
  const segmentItems = useMemo(
    () => [
      { label: "For Spouse", value: "spouse" as Recipient, icon: "heart-outline" as const },
      { label: "For Children", value: "kid" as Recipient, icon: "sparkles-outline" as const },
      { label: "For Family", value: "family" as Recipient, icon: "people-outline" as const },
    ],
    []
  );

  const onEnableWebPush = async () => {
    try {
      setStatus("Enabling web notifications...");
      const msg = await enableWebPush();
      setStatus(msg);
    } catch (e: any) {
      setStatus(e?.message || "Failed to enable web notifications");
    }
  };

  if (!prefs || !idea) {
    return (
      <LinearGradient colors={["#05070f", "#09122a", "#101b34"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: "#cbd5f5", fontSize: 16 }}>Warming up today's idea...</Text>
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
            rowGap: bp.gap + 12,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.nav}>
            <View style={styles.brand}>
              <LinearGradient
                colors={["#7cf5ff", "#58a6ff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandBadge}
              >
                <Ionicons name="heart" size={18} color="#050a1b" />
              </LinearGradient>
              <View>
                <Text style={styles.brandText}>Love Today</Text>
                <Text style={styles.brandSub}>Little acts, lasting joy</Text>
              </View>
            </View>

            <View style={styles.navRight}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color="#ffb347" />
                <Text style={styles.streakCount}>{streakCurrent}</Text>
                <Text style={styles.streakLabel}>days</Text>
              </View>
              <Pressable style={styles.iconBtn}>
                <Ionicons name="person-circle-outline" size={22} color="#c7d2ff" />
              </Pressable>
            </View>
          </View>

          <LinearGradient
            colors={["rgba(124,245,255,0.28)", "rgba(99,102,241,0.2)", "rgba(10,14,32,0.9)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.hero,
              {
                borderRadius: bp.radius + 8,
                flexDirection: bp.isMobile ? "column" : "row",
              },
            ]}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroPill}>
                <View style={styles.heroDot} />
                <Text style={styles.heroPillText}>Daily nudge</Text>
              </View>
              <Text style={[styles.heroTitle, { fontSize: bp.titleSize + 4 }]}>
                Make space for everyday love.
              </Text>
              <Text style={styles.heroSubtitle}>
                Fresh prompts curated for your people, gently nudging you to connect and celebrate what matters.
              </Text>

              <View style={styles.heroMeta}>
                <View style={styles.metaCard}>
                  <Ionicons name="sparkles-outline" size={16} color="#a6f6ff" />
                  <Text style={styles.metaLabel}>Today's vibe</Text>
                  <Text style={styles.metaValue}>{dayjs().format("MMM D")}</Text>
                </View>
                <View style={styles.metaCard}>
                  <Ionicons name="time-outline" size={16} color="#a6f6ff" />
                  <Text style={styles.metaLabel}>Reminder</Text>
                  <Text style={styles.metaValue}>{remindAt}</Text>
                </View>
              </View>

              {Platform.OS === "web" ? (
                <Pressable onPress={onEnableWebPush} style={[styles.heroAction, styles.heroActionPrimary]}>
                  <Ionicons name="notifications-outline" size={18} color="#050b18" />
                  <Text style={styles.heroActionText}>Enable web notifications</Text>
                </Pressable>
              ) : (
                <View style={[styles.heroAction, styles.heroActionGhost]}>
                  <Ionicons name="notifications-outline" size={18} color="#7f8ab8" />
                  <Text style={styles.heroActionGhostText}>Daily reminder at {remindAt}</Text>
                </View>
              )}

              {status ? <Text style={styles.status}>{status}</Text> : null}
            </View>

            <View style={styles.heroPreview}>
              <View style={styles.previewOrb} />
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewBadge}>
                    <View style={styles.previewDot} />
                    <Text style={styles.previewDay}>Today</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                </View>
                <Text style={styles.previewCopy}>
                  Send a kind text to someone you haven't checked on in a while.
                </Text>
                <View style={styles.previewFooter}>
                  <Ionicons name="timer-outline" size={14} color="#8ba2d6" />
                  <Text style={styles.previewFooterText}>~5 mins / meaningful</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View
            style={[
              styles.segmentWrap,
              {
                flexDirection: bp.isMobile ? "column" : "row",
              },
            ]}
          >
            {segmentItems.map((item) => (
              <Segment
                key={item.value}
                label={item.label}
                icon={item.icon}
                active={recipient === item.value}
                onPress={() => setRecipient(item.value)}
                style={{
                  flex: bp.isMobile ? undefined : 1,
                  width: bp.isMobile ? "100%" : undefined,
                }}
              />
            ))}
          </View>

          {recipient === "kid" && kids.length > 0 && (
            <View style={styles.kidRow}>
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

          <View style={[styles.todayCard, { borderRadius: bp.radius + 4 }]}>
            <View style={styles.todayHeader}>
              <View style={styles.todayBadge}>
                <Ionicons name="sparkles" size={14} color="#0f172a" />
                <Text style={styles.todayBadgeText}>Today's idea</Text>
              </View>
              <Text style={styles.todayDate}>{dayjs().format("MMM D")}</Text>
            </View>

            <Text style={[styles.todayIdea, { fontSize: bp.bodySize + 4 }]}>
              {renderIdeaText(idea, prefs, { kidId })}
            </Text>

            {prefs.faithMode && idea.faith && (
              <View style={styles.verseCard}>
                <Ionicons name="book-outline" size={16} color="#34d399" />
                <View>
                  <Text style={styles.verseText}>{idea.faith.verse}</Text>
                  <Text style={styles.verseRef}>{idea.faith.ref}</Text>
                </View>
              </View>
            )}

            {ideaCompleted ? (
              <View
                style={[
                  styles.actionGrid,
                  styles.actionGridDone,
                  { width: "100%" },
                ]}
              >
                <View style={styles.actionDoneBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                  <Text style={styles.actionDoneText}>Done</Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.actionGrid,
                  {
                    flexDirection: bp.isMobile ? "column" : "row",
                    justifyContent: bp.isMobile ? "flex-start" : "space-between",
                  },
                ]}
              >
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.actionPrimary,
                    bp.isMobile ? styles.actionButtonFull : undefined,
                  ]}
                  onPress={markDone}
                >
                  <Ionicons name="checkmark" size={18} color="#04111d" />
                  <Text style={styles.actionPrimaryText}>Mark done</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.actionSecondary,
                    bp.isMobile ? styles.actionButtonFull : undefined,
                  ]}
                  onPress={refresh}
                >
                  <Ionicons name="shuffle" size={18} color="#8ba2d6" />
                  <Text style={styles.actionSecondaryText}>Swap idea</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.actionOutline,
                    bp.isMobile ? styles.actionButtonFull : undefined,
                  ]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera-outline" size={18} color="#9aa9d6" />
                  <Text style={styles.actionOutlineText}>Take photo</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionButton,
                    styles.actionOutline,
                    bp.isMobile ? styles.actionButtonFull : undefined,
                  ]}
                  onPress={chooseFromLibrary}
                >
                  <Ionicons name="images-outline" size={18} color="#9aa9d6" />
                  <Text style={styles.actionOutlineText}>Choose photo</Text>
                </Pressable>
              </View>
            )}

            {Platform.OS === "web" && (
              <Text style={styles.tipText}>
                Tip: On iPhone, install to Home Screen to receive web push notifications.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Segment({
  label,
  icon,
  active,
  onPress,
  style,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  active: boolean;
  onPress: () => void;
  style?: any;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, active && styles.segmentActive, style]}>
      <View style={[styles.segmentInner, active && styles.segmentInnerActive]}>
        <Ionicons name={icon} size={16} color={active ? "#050b18" : "#9aa9d6"} />
        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(13,18,35,0.7)",
    borderWidth: 1,
    borderColor: "rgba(120,145,255,0.18)",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: "#f8fbff", fontWeight: "800", fontSize: 16, letterSpacing: 0.4 },
  brandSub: { color: "#97a2c7", fontSize: 12 },
  navRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,24,44,0.85)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.25)",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 18,
    backgroundColor: "rgba(255,183,77,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,183,77,0.3)",
  },
  streakCount: { color: "#ffe28a", fontWeight: "800", fontSize: 16 },
  streakLabel: { color: "#d7c193", fontSize: 12, fontWeight: "600", letterSpacing: 0.6 },

  hero: {
    borderWidth: 1,
    borderColor: "rgba(118,132,255,0.28)",
    overflow: "hidden",
    padding: 24,
    gap: 24,
  },
  heroContent: { flex: 1, gap: 14 },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: "rgba(8,13,28,0.85)",
    borderWidth: 1,
    borderColor: "rgba(118,132,255,0.28)",
  },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7cf5ff" },
  heroPillText: { color: "#9be8ff", fontWeight: "700", fontSize: 12, letterSpacing: 0.6 },
  heroTitle: { color: "#f8fbff", fontWeight: "800", lineHeight: 32 },
  heroSubtitle: { color: "#b2bddf", fontSize: 14, lineHeight: 20 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaCard: {
    minWidth: 120,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(10,18,36,0.68)",
    borderWidth: 1,
    borderColor: "rgba(118,132,255,0.28)",
    gap: 4,
  },
  metaLabel: { color: "#90a2d8", fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },
  metaValue: { color: "#e6f2ff", fontWeight: "700", fontSize: 16 },
  heroAction: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  heroActionPrimary: {
    backgroundColor: "#7cf5ff",
    ...(Platform.OS === "android"
      ? { elevation: 6 }
      : {
          shadowColor: "#7cf5ff",
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
        }),
  },
  heroActionText: { color: "#050b18", fontWeight: "700" },
  heroActionGhost: {
    backgroundColor: "rgba(15,24,44,0.85)",
    borderWidth: 1,
    borderColor: "rgba(124,133,172,0.4)",
  },
  heroActionGhostText: { color: "#9aa9d6", fontWeight: "700" },
  heroPreview: {
    flexBasis: 240,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 12,
  },
  previewOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(124,245,255,0.2)",
    opacity: 0.7,
  },
  previewCard: {
    width: 220,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(9,15,28,0.92)",
    borderWidth: 1,
    borderColor: "rgba(128,149,255,0.28)",
    gap: 12,
  },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewBadge: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7cf5ff" },
  previewDay: { color: "#d9e7ff", fontWeight: "700", fontSize: 12, letterSpacing: 0.4 },
  previewCopy: { color: "#f5f7ff", fontWeight: "600", lineHeight: 20 },
  previewFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
  previewFooterText: { color: "#8ba2d6", fontSize: 12, fontWeight: "600" },

  segmentWrap: { gap: 12 },
  segment: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(121,134,190,0.28)",
    backgroundColor: "rgba(11,18,32,0.7)",
    padding: 2,
  },
  segmentActive: { borderColor: "#7cf5ff", backgroundColor: "rgba(124,245,255,0.18)" },
  segmentInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  segmentInnerActive: { backgroundColor: "#7cf5ff" },
  segmentText: { color: "#9aa9d6", fontWeight: "700" },
  segmentTextActive: { color: "#050b18" },

  kidRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: -4 },
  kidPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(121,145,255,0.3)",
    backgroundColor: "rgba(13,19,35,0.75)",
  },
  kidPillActive: { borderColor: "#7cf5ff", backgroundColor: "rgba(124,245,255,0.24)" },
  kidPillText: { color: "#aebaea", fontWeight: "700" },
  kidPillTextActive: { color: "#050b18" },

  todayCard: {
    padding: 24,
    backgroundColor: "rgba(18,24,42,0.8)",
    borderWidth: 1,
    borderColor: "rgba(128,149,255,0.28)",
    gap: 18,
  },
  todayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(124,245,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(124,245,255,0.42)",
  },
  todayBadgeText: { color: "#0f172a", fontWeight: "700", fontSize: 12, letterSpacing: 0.4 },
  todayDate: { color: "#a0b2e6", fontWeight: "600" },
  todayIdea: { color: "#f8fbff", fontWeight: "700", lineHeight: 26 },
  verseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(20,34,46,0.9)",
    borderWidth: 1,
    borderColor: "rgba(86,225,157,0.3)",
  },
  verseText: { color: "#dcfce7", fontWeight: "700" },
  verseRef: { color: "#a7f3d0", fontSize: 12 },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    width: "48%",
  },
  actionButtonFull: { width: "100%" },
  actionPrimary: { backgroundColor: "#4ade80" },
  actionPrimaryText: { color: "#04111d", fontWeight: "800" },
  actionSecondary: {
    backgroundColor: "rgba(79,70,229,0.16)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.45)",
  },
  actionSecondaryText: { color: "#9aa9d6", fontWeight: "700" },
  actionOutline: {
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
    backgroundColor: "rgba(13,19,35,0.82)",
  },
  actionOutlineText: { color: "#9aa9d6", fontWeight: "700" },
  actionGridDone: { alignItems: "center", justifyContent: "center" },
  actionDoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "rgba(74,222,128,0.18)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.5)",
  },
  actionDoneText: { color: "#4ade80", fontWeight: "800" },

  tipText: { color: "#8ba2d6", fontSize: 12 },
  status: { marginTop: 8, color: "#9aa9d6", fontSize: 12 },
});
