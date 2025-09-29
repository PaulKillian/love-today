import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
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
  const bp = useBreakpoints();

  const load = useCallback(async () => {
    const s = await loadStreak();
    setStreak({ current: s.current, longest: s.longest });

    const list: Moment[] = await getMoments();
    const byRec = { spouse: 0, kid: 0, family: 0 } as { spouse: number; kid: number; family: number };
    list.forEach((m) => { byRec[m.recipient] = (byRec[m.recipient] || 0) + 1; });
    setCounts(byRec);

    const startOfMonth = dayjs().startOf("month").valueOf();
    const inMonth = list.filter((m) => m.ts >= startOfMonth).length;
    setMonth({ label: dayjs().format("MMMM YYYY"), total: inMonth });
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(React.useCallback(() => { load(); }, [load]));

  // Tiny bars without a chart lib
  const max = Math.max(1, counts.spouse, counts.kid, counts.family);
  const Bar = ({ label, value }: { label: string; value: number }) => (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${(value / max) * 100}%` }]} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={{ width: "100%", maxWidth: 900, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 14 }}>
          <Text style={styles.heading}>Stats</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Streaks</Text>
            <View style={styles.row}>
              <View style={styles.streakBubble}>
                <Text style={styles.streakNum}>{streak.current}</Text>
                <Text style={styles.streakLabel}>Current</Text>
              </View>
              <View style={styles.streakBubble}>
                <Text style={styles.streakNum}>{streak.longest}</Text>
                <Text style={styles.streakLabel}>Longest</Text>
              </View>
            </View>
            <Text style={styles.helper}>Streak counts the days you tapped “Done”.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Month</Text>
            <Text style={styles.sub}>{month.label} • {month.total} moment{month.total===1?"":"s"}</Text>
            <Bar label="For Spouse" value={counts.spouse} />
            <Bar label="For Children" value={counts.kid} />
            <Bar label="For Family" value={counts.family} />
          </View>

          <Text style={styles.footer}>Keep showing love—small things, every day. 💛</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

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
  row: { flexDirection: "row", gap: 12 },
  streakBubble: {
    flex: 1,
    backgroundColor: "rgba(96,165,250,0.15)",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  streakNum: { color: "#0b132b", fontWeight: "900", fontSize: 28 },
  streakLabel: { color: "#334155", fontWeight: "700", marginTop: 4 },
  helper: { color: "#6b5a9d", marginTop: 8 },

  sub: { color: "#6b5a9d", marginBottom: 10, fontWeight: "700" },
  barLabel: { color: "#1a1330", fontWeight: "700" },
  barValue: { color: "#6b5a9d", fontWeight: "700" },
  barTrack: { height: 10, backgroundColor: "rgba(148,163,184,0.25)", borderRadius: 999, overflow: "hidden", marginTop: 6 },
  barFill: { height: "100%", backgroundColor: "#60a5fa" },

  footer: { color: "#fff", textAlign: "center", marginTop: 6, opacity: 0.9 },
});
