import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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

export default function Today() {
  const bp = useBreakpoints();

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [recipient, setRecipient] = useState<Recipient>("spouse");
  const [kidId, setKidId] = useState<string | undefined>(undefined);
  const [streakCurrent, setStreakCurrent] = useState<number>(0);

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

      if (Platform.OS !== "web" && p.remindAt) {
        const [h, m] = p.remindAt.split(":").map(Number);
        await scheduleDailyLocal(h, m);
      }

      setIdea(pickIdea(p, recipient, kidId));

      // load streak badge
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
    const s = await tickStreak();  // update streak
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

  if (!prefs || !idea) {
    return (
      <LinearGradient colors={["#EEC9FF", "#B7D1FF"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: bp.containerPad, paddingTop: 20 }}>
            <Text style={{ color: "#fff", fontSize: 18 }}>Loading…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const kids = prefs.profiles?.kids ?? [];

  return (
    <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* Scrollable content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: 1200,
            alignSelf: "center",
            paddingHorizontal: bp.containerPad,
            paddingTop: 12,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { marginBottom: bp.gap + 4 }]}>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="menu" size={22} color="#ffffff" />
            </Pressable>
            <Text style={[styles.title, { fontSize: bp.titleSize }]}>Ways to Show Love</Text>
            <View style={styles.headerRight}>
              {/* flame streak badge */}
              <View style={styles.streakBadge}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakText}>{streakCurrent}</Text>
              </View>
            </View>
          </View>

          {/* Primary card */}
          <View style={[styles.primaryCard, { borderRadius: bp.radius }]}>
            <Image
              source={require("../../assets/ui/clipboard.png")}
              style={styles.primaryIcon}
              resizeMode="contain"
            />
            <Text style={[styles.primaryText, { fontSize: bp.bodySize }]}>
              {recipient === "spouse"
                ? `Make a list of reasons why you love ${prefs.profiles?.spouse?.name || "your spouse"}`
                : recipient === "kid"
                ? "Plan a 15-minute one-on-one with your child"
                : "Plan a tech-free 20-minute activity with your family"}
            </Text>
          </View>

          {/* Segmented control */}
          <View
            style={[
              styles.segmentWrap,
              { flexDirection: bp.isMobile ? "column" : "row", gap: bp.gap, marginBottom: bp.gap + 4 },
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

          {/* Kid selector */}
          {recipient === "kid" && kids.length > 0 && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
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

          {/* Illustration cards — responsive 1/2/3 columns; images capped to ~20% viewport height */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: bp.gap, marginBottom: 14 }}>
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

          {/* Today’s idea */}
          <View style={[styles.todayCard, { borderRadius: bp.radius }]}>
            <Text style={[styles.todayLabel, { marginBottom: 8 }]}>
              Today’s Idea • {dayjs().format("MMM D")}
            </Text>
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
              <Text style={{ color: "#777", marginTop: 8 }}>
                Camera/notifications are limited on web. Test on a device via Expo Go or a dev build.
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
  // Target ~20% of viewport height; clamp to sensible min/max for phones & desktops
  const imgH = Math.max(120, Math.min(260, Math.floor(height * 0.2)));

  return (
    <View style={[styles.glassCard, { width: widthPct }]}>
      <Image
        source={image}
        style={{
          width: "100%",
          height: imgH,
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.55)",
        }}
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
  header: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginRight: 10,
  },
  title: { color: "#fff", fontWeight: "800", flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  streakFlame: { fontSize: 14, color: "#fff" },
  streakText: { color: "#fff", fontWeight: "800" },

  primaryCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    marginTop: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    ...shadow(14),
  },
  primaryIcon: { width: 56, height: 56, marginRight: 12 },
  primaryText: { color: "#2b2342", fontWeight: "700", flexShrink: 1 },

  segmentWrap: {},
  segment: {
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  segmentActive: { backgroundColor: "rgba(255,255,255,0.55)" },
  segmentText: { color: "#362b56", fontWeight: "700" },
  segmentTextActive: { color: "#1f163a" },

  kidPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  kidPillActive: { backgroundColor: "rgba(255,255,255,0.8)" },
  kidPillText: { color: "#2b2342", fontWeight: "700" },
  kidPillTextActive: { color: "#1f163a" },

  glassCard: {
    borderRadius: 22,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    ...shadow(10),
  },
  glassTitle: { color: "#2b2342", fontWeight: "700", marginTop: 8 },

  todayCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    ...shadow(12),
  },
  todayLabel: { color: "#6b5a9d", fontWeight: "700" },
  todayText: { color: "#1a1330", fontWeight: "700", marginTop: 6, marginBottom: 8 },
  verse: { color: "#2f855a", marginBottom: 12 },

  row: { flexDirection: "row", gap: 10 },
  cta: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8, // lets buttons wrap nicely on small screens
  },
  ctaTextDark: { color: "#000", fontWeight: "800" },
});

/** subtle shadow util */
function shadow(elevation: number) {
  return Platform.select({
    android: { elevation },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: elevation,
      shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
    },
    default: {},
  });
}
