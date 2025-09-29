import dayjs from "dayjs";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { getMoments } from "../../lib/moments";
import { useBreakpoints } from "../../lib/responsive";
import { Moment } from "../../types";

type Range = "7" | "30" | "all";

export default function ShareCollage() {
  const [range, setRange] = useState<Range>("7");
  const [items, setItems] = useState<Moment[]>([]);
  const [busy, setBusy] = useState(false);
  const bp = useBreakpoints();
  const shotRef = useRef<View>(null);

  const load = useCallback(async () => {
    const all = await getMoments();
    const cutoff =
      range === "all" ? 0 : Date.now() - Number(range) * 24 * 60 * 60 * 1000;
    setItems(all.filter((m) => m.ts >= cutoff));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => {
    if (range === "all") return "Family Moments – All Time";
    return `Family Moments – Last ${range} Days`;
  }, [range]);

  const dateRange = useMemo(() => {
    if (items.length === 0) return "";
    const min = dayjs(Math.min(...items.map((m) => m.ts))).format("MMM D, YYYY");
    const max = dayjs(Math.max(...items.map((m) => m.ts))).format("MMM D, YYYY");
    return `${min} — ${max}`;
  }, [items]);

  const exportCollage = useCallback(async () => {
    if (!shotRef.current) return;
    try {
      setBusy(true);
      const base64 = await captureRef(shotRef, {
        format: "png",
        quality: 1,
        result: "base64",
      });

      if (Platform.OS === "web") {
        // Create a downloadable file on web
        const url = `data:image/png;base64,${base64}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `moments-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        Alert.alert("Downloaded", "Collage image saved by your browser.");
      } else {
        // Save to temp and share natively
        const uri = FileSystem.cacheDirectory + `moments-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(uri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: "image/png" });
        } else {
          Alert.alert("Saved", `Collage saved to cache:\n${uri}`);
        }
      }
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Oops", e?.message ?? "Failed to export collage.");
    } finally {
      setBusy(false);
    }
  }, []);

  const columns = bp.cols; // 1/2/3 responsive

  const RangeButton = ({ value, label }: { value: Range; label: string }) => (
    <Pressable
      onPress={() => setRange(value)}
      style={[
        styles.rangeBtn,
        range === value && styles.rangeBtnActive,
      ]}
    >
      <Text
        style={[
          styles.rangeText,
          range === value && styles.rangeTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderItem = ({ item }: { item: Moment }) => (
    <View style={styles.cell}>
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={styles.cellImg} />
      ) : (
        <View style={[styles.cellImg, styles.noImg]}>
          <Text style={{ color: "#6b5a9d" }}>No photo</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={styles.heading}>Share</Text>

          {/* Range selector */}
          <View style={styles.rangeRow}>
            <RangeButton value="7" label="Last 7 days" />
            <RangeButton value="30" label="Last 30 days" />
            <RangeButton value="all" label="All time" />
          </View>

          {/* Collage preview wrapped in ViewShot */}
          <View ref={shotRef} collapsable={false} style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            {dateRange ? <Text style={styles.cardSub}>{dateRange}</Text> : null}

            <FlatList
              data={items}
              key={columns}
              numColumns={columns}
              columnWrapperStyle={columns > 1 ? { gap: 8 } : undefined}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              renderItem={renderItem}
              keyExtractor={(m) => m.id}
              ListEmptyComponent={
                <Text style={{ color: "#6b5a9d", marginTop: 8 }}>
                  No moments in this range yet.
                </Text>
              }
            />

            <Text style={styles.footerNote}>
              Generated with Love Today • {dayjs().format("MMM D, YYYY")}
            </Text>
          </View>

          {/* Export button */}
          <Pressable
            onPress={exportCollage}
            disabled={busy}
            style={[
              styles.cta,
              { backgroundColor: busy ? "#cbd5e1" : "#60a5fa" },
            ]}
          >
            <Text style={styles.ctaText}>
              {busy ? "Exporting…" : "Export Collage"}
            </Text>
          </Pressable>

          {Platform.OS === "web" && (
            <Text style={styles.webHint}>
              On web, the collage will download as a PNG. On iOS/Android, it opens the native share sheet.
            </Text>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heading: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  rangeRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  rangeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  rangeBtnActive: { backgroundColor: "rgba(255,255,255,0.9)" },
  rangeText: { color: "#2b2342", fontWeight: "700" },
  rangeTextActive: { color: "#1f163a" },

  card: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  cardTitle: { color: "#1a1330", fontWeight: "800", fontSize: 18 },
  cardSub: { color: "#6b5a9d", marginBottom: 8 },
  footerNote: { color: "#6b5a9d", fontSize: 12, marginTop: 8 },

  cell: { flex: 1, borderRadius: 10, overflow: "hidden" },
  cellImg: { width: "100%", aspectRatio: 1, backgroundColor: "#eef" },
  noImg: { alignItems: "center", justifyContent: "center" },

  cta: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaText: { color: "#0b132b", fontWeight: "800" },
  webHint: { color: "#fff", marginTop: 8, opacity: 0.9 },
});
