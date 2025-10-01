import { Ionicons } from "@expo/vector-icons";
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
    const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 24 * 60 * 60 * 1000;
    setItems(all.filter((m) => m.ts >= cutoff));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  const title = useMemo(() => {
    if (range === "all") return "Family Moments - All Time";
    return `Family Moments - Last ${range} Days`;
  }, [range]);

  const dateRange = useMemo(() => {
    if (items.length === 0) return "";
    const min = dayjs(Math.min(...items.map((m) => m.ts))).format("MMM D, YYYY");
    const max = dayjs(Math.max(...items.map((m) => m.ts))).format("MMM D, YYYY");
    return `${min} - ${max}`;
  }, [items]);

  const exportCollage = useCallback(async () => {
    if (!shotRef.current || busy) return;
    try {
      setBusy(true);
      const base64 = await captureRef(shotRef, {
        format: "png",
        quality: 1,
        result: "base64",
      });

      if (Platform.OS === "web") {
        const url = `data:image/png;base64,${base64}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = `moments-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        Alert.alert("Downloaded", "Collage image saved by your browser.");
      } else {
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
  }, [busy]);

  const columns = bp.cols;

  const RangeButton = ({ value, label }: { value: Range; label: string }) => {
    const active = range === value;
    return (
      <Pressable onPress={() => setRange(value)} style={[styles.rangeBtn, active && styles.rangeBtnActive]}>
        <LinearGradient
          colors={active ? ["#7cf5ff", "#5d8aff"] : ["rgba(13,22,36,0.9)", "rgba(13,22,36,0.9)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rangeBtnInner}
        >
          <Ionicons
            name={value === "7" ? "sunny-outline" : value === "30" ? "calendar-outline" : "infinite-outline"}
            size={14}
            color={active ? "#050b18" : "#8ba2d6"}
          />
          <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: Moment }) => (
    <View style={[styles.cell, { flex: 1 / columns }]}> 
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={styles.cellImg} />
      ) : (
        <View style={[styles.cellImg, styles.noImg]}>
          <Ionicons name="image-outline" size={18} color="#7aa5ff" />
          <Text style={styles.noImgText}>No photo</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#05070f", "#0a1326", "#111f3a"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingHorizontal: bp.containerPad }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Share</Text>
              <Text style={styles.subheading}>Bundle your recent memories into a polished collage and share with your people.</Text>
              <Text style={styles.meta}>
                {items.length} photo{items.length === 1 ? "" : "s"} in this view
              </Text>
            </View>
            <Pressable onPress={exportCollage} disabled={busy} style={[styles.exportBtn, busy && styles.exportBtnDisabled]}>
              <Ionicons name={busy ? "hourglass-outline" : "share-social-outline"} size={18} color={busy ? "#1b2740" : "#050b18"} />
              <Text style={[styles.exportText, busy && styles.exportTextDisabled]}>{busy ? "Exporting" : "Export"}</Text>
            </Pressable>
          </View>

          <View style={[styles.rangeRow, { flexDirection: bp.isMobile ? "column" : "row" }]}>
            <RangeButton value="7" label="Last 7 days" />
            <RangeButton value="30" label="Last 30 days" />
            <RangeButton value="all" label="All time" />
          </View>

          <LinearGradient
            colors={["rgba(124,245,255,0.18)", "rgba(98,117,255,0.1)", "rgba(12,20,40,0.95)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewCard}
          >
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewTitle}>{title}</Text>
                {dateRange ? <Text style={styles.previewSubtitle}>{dateRange}</Text> : null}
              </View>
              <View style={styles.badge}>
                <Ionicons name="sparkles-outline" size={14} color="#050b18" />
                <Text style={styles.badgeText}>Auto layout</Text>
              </View>
            </View>

            <View ref={shotRef} collapsable={false} style={[styles.gridWrap, { gap: columns > 1 ? 12 : 8 }]}>
              <FlatList
                data={items}
                key={columns}
                numColumns={columns}
                columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
                contentContainerStyle={{ gap: 12 }}
                renderItem={renderItem}
                keyExtractor={(m) => m.id}
                ListEmptyComponent={
                  <View style={styles.empty}
                  >
                    <Ionicons name="images-outline" size={18} color="#8ba2d6" />
                    <Text style={styles.emptyText}>No moments in this range yet.</Text>
                  </View>
                }
              />
            </View>

            <Text style={styles.footerNote}>Generated with Love Today - {dayjs().format("MMM D, YYYY")}</Text>
          </LinearGradient>

          {Platform.OS === "web" && (
            <Text style={styles.webHint}>
              On web, the collage downloads as a PNG. On iOS/Android the native share sheet opens.
            </Text>
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 26,
    backgroundColor: "rgba(18,28,52,0.82)",
    borderWidth: 1,
    borderColor: "rgba(125,147,255,0.24)",
  },
  heading: { color: "#f8fbff", fontSize: 26, fontWeight: "800" },
  subheading: { color: "#aab8e5", marginTop: 6, lineHeight: 20 },
  meta: { color: "#6c7aaf", marginTop: 8, fontSize: 12, fontWeight: "600" },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#7cf5ff",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  exportBtnDisabled: { backgroundColor: "rgba(124,245,255,0.4)" },
  exportText: { color: "#050b18", fontWeight: "800" },
  exportTextDisabled: { color: "#1b2740" },

  rangeRow: {
    gap: 12,
    alignItems: "stretch",
  },
  rangeBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.24)",
    backgroundColor: "rgba(13,22,36,0.6)",
  },
  rangeBtnActive: { borderColor: "rgba(124,245,255,0.8)" },
  rangeBtnInner: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeText: { color: "#8ba2d6", fontWeight: "700" },
  rangeTextActive: { color: "#050b18" },

  previewCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.28)",
    padding: 20,
    gap: 18,
  },
  previewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  previewTitle: { color: "#f1f5ff", fontWeight: "800", fontSize: 18 },
  previewSubtitle: { color: "#8ba2d6", marginTop: 4, fontWeight: "600" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(124,245,255,0.24)",
    borderWidth: 1,
    borderColor: "rgba(124,245,255,0.35)",
  },
  badgeText: { color: "#050b18", fontWeight: "700", fontSize: 12 },
  gridWrap: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(10,18,34,0.86)",
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.22)",
    padding: 12,
  },
  cell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  cellImg: { width: "100%", height: "100%", backgroundColor: "rgba(12,18,32,0.75)" },
  noImg: { alignItems: "center", justifyContent: "center", gap: 6 },
  noImgText: { color: "#8ba2d6", fontWeight: "600", fontSize: 12 },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 40,
  },
  emptyText: { color: "#8ba2d6", fontWeight: "600" },

  footerNote: { color: "#6c7aaf", fontSize: 12, textAlign: "center", marginTop: 6 },
  webHint: { color: "#8ba2d6", fontSize: 12, marginTop: 12, textAlign: "center" },
});
