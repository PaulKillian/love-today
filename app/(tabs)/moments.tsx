import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMoments, removeMoment } from "../../lib/moments";
import { useBreakpoints } from "../../lib/responsive";
import { Moment } from "../../types";

export default function Moments() {
  const [items, setItems] = useState<Moment[]>([]);
  const [open, setOpen] = useState<Moment | null>(null);
  const bp = useBreakpoints();

  const load = useCallback(async () => {
    setItems(await getMoments());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const latestMoment = useMemo(() => (items.length > 0 ? items[0] : null), [items]);

  const renderItem = ({ item }: { item: Moment }) => (
    <Pressable onPress={() => setOpen(item)} style={[styles.card, { width: bp.cols > 1 ? `${100 / bp.cols - 1}%` : "100%" }]}>
      <View style={styles.cardMedia}>
        {item.photoUri ? (
          <Image source={{ uri: item.photoUri }} style={styles.cardImg} />
        ) : (
          <View style={[styles.cardImg, styles.noImg]}>
            <Ionicons name="image-outline" size={20} color="#7aa5ff" />
            <Text style={styles.noImgText}>No photo</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.text}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={12} color="#7aa5ff" />
          <Text style={styles.cardMetaText}>{dayjs(item.ts).format("MMM D, YYYY - h:mm A")}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <LinearGradient colors={["#05070f", "#0a1326", "#111f3a"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingHorizontal: bp.containerPad }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Family Moments</Text>
              <Text style={styles.subheading}>Capture and revisit the little celebrations that build your story.</Text>
              {latestMoment ? (
                <Text style={styles.meta}>
                  Last added {dayjs(latestMoment.ts).format("MMM D, YYYY - h:mm A")}
                </Text>
              ) : (
                <Text style={styles.meta}>No saved moments yet. Your first one will appear here.</Text>
              )}
            </View>
            <View style={styles.countBadge}>
              <Ionicons name="images-outline" size={18} color="#050b18" />
              <Text style={styles.countLabel}>{items.length}</Text>
            </View>
          </View>

          <FlatList
            data={items}
            key={bp.cols}
            numColumns={bp.cols}
            columnWrapperStyle={bp.cols > 1 ? { gap: bp.gap } : undefined}
            contentContainerStyle={{
              paddingBottom: 32,
              gap: bp.gap,
              paddingTop: 10,
            }}
            renderItem={renderItem}
            keyExtractor={(m) => m.id}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={20} color="#8ba2d6" />
                <Text style={styles.emptyText}>Log a moment from the Today tab to start this gallery.</Text>
              </View>
            }
          />
        </View>

        <Modal visible={!!open} animationType="fade" transparent onRequestClose={() => setOpen(null)}>
          <View style={styles.modalBackdrop}>
            <LinearGradient colors={["rgba(5,7,15,0.92)", "rgba(16,27,58,0.95)"]} style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text numberOfLines={2} style={styles.modalTitle}>
                  {open?.text}
                </Text>
                <Pressable onPress={() => setOpen(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color="#0b1424" />
                </Pressable>
              </View>
              <Text style={styles.modalDate}>
                {open && dayjs(open.ts).format("MMMM D, YYYY · h:mm A")}
              </Text>
              {open?.photoUri ? (
                <Image source={{ uri: open.photoUri }} style={styles.modalImg} resizeMode="cover" />
              ) : (
                <View style={[styles.modalImg, styles.noImg]}>
                  <Ionicons name="image-outline" size={22} color="#7aa5ff" />
                  <Text style={styles.noImgText}>No photo</Text>
                </View>
              )}
              <View style={styles.modalActions}>
                <Pressable onPress={() => setOpen(null)} style={[styles.actionBtn, styles.actionGhost]}>
                  <Text style={styles.actionGhostText}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!open) return;
                    await removeMoment(open.id);
                    setOpen(null);
                    load();
                  }}
                  style={[styles.actionBtn, styles.actionDanger]}
                >
                  <Text style={styles.actionDangerText}>Delete</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </Modal>
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
    paddingTop: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 20,
    borderRadius: 26,
    backgroundColor: "rgba(18,28,52,0.8)",
    borderWidth: 1,
    borderColor: "rgba(125,147,255,0.25)",
  },
  heading: { color: "#f8fbff", fontSize: 24, fontWeight: "800" },
  subheading: { color: "#aab8e5", marginTop: 6, lineHeight: 20 },
  meta: { color: "#6c7aaf", marginTop: 10, fontSize: 12, fontWeight: "600" },
  countBadge: {
    height: 60,
    minWidth: 72,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#7cf5ff",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  countLabel: { color: "#050b18", fontSize: 22, fontWeight: "800" },

  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(18,26,44,0.78)",
    borderWidth: 1,
    borderColor: "rgba(128,149,255,0.2)",
  },
  cardMedia: { width: "100%", borderBottomWidth: 1, borderBottomColor: "rgba(128,149,255,0.16)" },
  cardImg: { width: "100%", aspectRatio: 4 / 3, backgroundColor: "rgba(12,18,32,0.8)" },
  noImg: { alignItems: "center", justifyContent: "center", gap: 6 },
  noImgText: { color: "#8ba2d6", fontWeight: "600" },
  cardBody: { padding: 14, gap: 10 },
  cardTitle: { color: "#f1f5ff", fontWeight: "700" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardMetaText: { color: "#8ba2d6", fontSize: 12, fontWeight: "600" },

  emptyCard: {
    marginTop: 40,
    alignItems: "center",
    gap: 10,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "rgba(14,22,38,0.88)",
    borderWidth: 1,
    borderColor: "rgba(123,147,255,0.24)",
  },
  emptyText: { color: "#9aaad9", textAlign: "center", lineHeight: 20 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,12,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(125,147,255,0.3)",
    gap: 16,
  },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  modalTitle: { flex: 1, color: "#f8fbff", fontWeight: "700", fontSize: 18 },
  modalDate: { color: "#8ba2d6", fontSize: 12, fontWeight: "600" },
  modalImg: {
    width: "100%",
    height: 280,
    borderRadius: 18,
    backgroundColor: "rgba(10,16,28,0.85)",
    borderWidth: 1,
    borderColor: "rgba(128,149,255,0.2)",
  },
  modalActions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionGhost: {
    borderWidth: 1,
    borderColor: "rgba(128,149,255,0.35)",
    backgroundColor: "rgba(12,21,37,0.7)",
  },
  actionGhostText: { color: "#9aa9d6", fontWeight: "700" },
  actionDanger: {
    backgroundColor: "rgba(239,68,68,0.16)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
  },
  actionDangerText: { color: "#fca5a5", fontWeight: "700" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7cf5ff",
  },
});
