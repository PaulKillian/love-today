import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMoments } from "../../lib/moments";
import { useBreakpoints } from "../../lib/responsive";
import { loadStreak } from "../../lib/streaks";
import { Moment } from "../../types";

export default function Stats() {
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [counts, setCounts] = useState<{ spouse: number; kid: number; family: number }>({ spouse: 0, kid: 0, family: 0 });
  const [month, setMonth] = useState<{ label: string; total: number }>({ label: "", total: 0 });
  const [moments, setMoments] = useState<Moment[]>([]);
  const bp = useBreakpoints();

  const load = useCallback(async () => {
    const s = await loadStreak();
    setStreak({ current: s.current, longest: s.longest });

    const list = await getMoments();
    setMoments(list);

    const byRec: { spouse: number; kid: number; family: number } = { spouse: 0, kid: 0, family: 0 };
    list.forEach((m) => {
      if (m.recipient === "spouse" || m.recipient === "kid" || m.recipient === "family") {
        byRec[m.recipient] = (byRec[m.recipient] || 0) + 1;
      }
    });
    setCounts(byRec);

    const startOfMonth = dayjs().startOf("month").valueOf();
    const inMonth = list.filter((m) => m.ts >= startOfMonth).length;
    setMonth({ label: dayjs().format("MMMM YYYY"), total: inMonth });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalMoments = moments.length;
  const firstMoment = useMemo(() => (moments.length > 0 ? dayjs(Math.min(...moments.map((m) => m.ts))).format("MMM D, YYYY") : null), [moments]);

  const max = Math.max(1, counts.spouse, counts.kid, counts.family);
  const Bar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={{ gap: 6 }}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${(value / max) * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#05070f", "#0a1326", "#111f3a"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingHorizontal: bp.containerPad }]}>
          <LinearGradient
            colors={["rgba(124,245,255,0.18)", "rgba(98,117,255,0.12)", "rgba(10,18,36,0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Stats</Text>
              <Text style={styles.subheading}>See the impact of your daily nudges and keep the momentum going.</Text>
              <Text style={styles.meta}>
                {totalMoments} logged moment{totalMoments === 1 ? "" : "s"}
                {firstMoment ? ` since ${firstMoment}` : ""}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="flame" size={20} color="#ffb347" />
              <View>
                <Text style={styles.heroBadgeLabel}>Current streak</Text>
                <Text style={styles.heroBadgeValue}>{streak.current} days</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.grid, { flexDirection: bp.isMobile ? "column" : "row" }]}>
            <View style={[styles.card, { flex: bp.isMobile ? undefined : 1 }]}>
              <Text style={styles.cardTitle}>Streaks</Text>
              <View style={[styles.streakRow, { flexDirection: bp.isMobile ? "column" : "row" }]}>
                <View style={[styles.streakTile, styles.streakCurrent]}>
                  <Text style={styles.streakValue}>{streak.current}</Text>
                  <Text style={styles.streakLabel}>Current</Text>
                </View>
                <View style={[styles.streakTile, styles.streakLongest]}>
                  <Text style={styles.streakValue}>{streak.longest}</Text>
                  <Text style={styles.streakLabel}>Longest</Text>
                </View>
              </View>
              <Text style={styles.helper}>A streak is one or more ideas completed on consecutive days.</Text>
            </View>

            <View style={[styles.card, { flex: bp.isMobile ? undefined : 1 }]}>
              <Text style={styles.cardTitle}>This Month</Text>
              <Text style={styles.subhead}>{month.label}</Text>
              <View style={styles.monthSummary}>
                <View style={styles.monthBadge}>
                  <Ionicons name="calendar-clear-outline" size={16} color="#050b18" />
                  <Text style={styles.monthBadgeText}>{month.total} moments</Text>
                </View>
                <Text style={styles.monthHint}>Keep the streak alive by logging at least one idea a day.</Text>
              </View>
              <View style={{ gap: 12 }}>
                <Bar label="For Spouse" value={counts.spouse} color="#7cf5ff" />
                <Bar label="For Children" value={counts.kid} color="#a78bfa" />
                <Bar label="For Family" value={counts.family} color="#60a5fa" />
              </View>
            </View>
          </View>

          <View style={styles.footerCard}>
            <Ionicons name="heart-outline" size={16} color="#8ba2d6" />
            <Text style={styles.footerText}>Keep showing love - small things, every day.</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingTop: 20,
    paddingBottom: 48,
    gap: 18,
  },
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
  subheading: { color: "#aab8e5", marginTop: 6, lineHeight: 20 },
  meta: { color: "#6c7aaf", marginTop: 10, fontSize: 12, fontWeight: "600" },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(15,24,44,0.9)",
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.28)",
  },
  heroBadgeLabel: { color: "#8ba2d6", fontSize: 12, fontWeight: "600" },
  heroBadgeValue: { color: "#f1f5ff", fontWeight: "700" },

  grid: { gap: 18 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.26)",
    backgroundColor: "rgba(12,20,40,0.88)",
    padding: 22,
    gap: 18,
  },
  cardTitle: { color: "#f1f5ff", fontWeight: "800", fontSize: 18 },
  subhead: { color: "#8ba2d6", fontWeight: "600" },
  streakRow: { gap: 18 },
  streakTile: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  streakCurrent: {
    backgroundColor: "rgba(124,245,255,0.18)",
    borderColor: "rgba(124,245,255,0.32)",
  },
  streakLongest: {
    backgroundColor: "rgba(167,139,250,0.16)",
    borderColor: "rgba(167,139,250,0.32)",
  },
  streakValue: { color: "#f8fbff", fontSize: 32, fontWeight: "800" },
  streakLabel: { color: "#8ba2d6", fontWeight: "600" },
  helper: { color: "#6c7aaf", fontSize: 12, lineHeight: 18 },

  monthSummary: { gap: 12 },
  monthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#7cf5ff",
  },
  monthBadgeText: { color: "#050b18", fontWeight: "700" },
  monthHint: { color: "#6c7aaf", fontSize: 12, lineHeight: 18 },

  barLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  barLabel: { color: "#f1f5ff", fontWeight: "700" },
  barValue: { color: "#8ba2d6", fontWeight: "700" },
  barTrack: { height: 10, borderRadius: 999, backgroundColor: "rgba(82,95,135,0.24)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999 },

  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.24)",
    backgroundColor: "rgba(15,24,44,0.85)",
  },
  footerText: { color: "#8ba2d6", fontWeight: "600" },
});
