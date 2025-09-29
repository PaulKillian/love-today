// app/(tabs)/moments.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
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

  useEffect(() => { load(); }, [load]);

  // Reload whenever the tab/screen gains focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }: { item: Moment }) => (
    <Pressable onPress={() => setOpen(item)} style={styles.card}>
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={styles.img} />
      ) : (
        <View style={[styles.img, styles.noImg]}>
          <Text style={{ color: "#6b5a9d" }}>No photo</Text>
        </View>
      )}
      <View style={styles.caption}>
        <Text numberOfLines={1} style={styles.captionTitle}>{item.text}</Text>
        <Text style={styles.captionDate}>{dayjs(item.ts).format("MMM D, YYYY • h:mm A")}</Text>
      </View>
    </Pressable>
  );

  return (
    <LinearGradient colors={["#F3D5FF", "#D0C7FF", "#BEE1FF"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <Text style={styles.heading}>Family Moments</Text>
        <FlatList
          data={items}
          key={bp.cols}
          numColumns={bp.cols}
          columnWrapperStyle={bp.cols > 1 ? { gap: bp.gap } : undefined}
          contentContainerStyle={{ paddingBottom: 24, gap: bp.gap }}
          renderItem={renderItem}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={<Text style={{ color: "#fff" }}>No moments yet. Log one from the Today tab.</Text>}
        />

        <Modal visible={!!open} animationType="slide" onRequestClose={() => setOpen(null)} transparent>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text numberOfLines={2} style={styles.modalTitle}>{open?.text}</Text>
                <Pressable onPress={() => setOpen(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#1f163a" />
                </Pressable>
              </View>
              <Text style={styles.modalDate}>{open && dayjs(open.ts).format("MMMM D, YYYY • h:mm A")}</Text>
              {open?.photoUri ? (
                <Image source={{ uri: open.photoUri }} style={styles.modalImg} resizeMode="cover" />
              ) : (
                <View style={[styles.modalImg, styles.noImg]}><Text>No photo</Text></View>
              )}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Pressable onPress={() => setOpen(null)} style={[styles.cta, { backgroundColor: "#eab308" }]}><Text style={styles.ctaTextDark}>Close</Text></Pressable>
                <Pressable
                  onPress={async () => { if (open) { await removeMoment(open.id); setOpen(null); load(); } }}
                  style={[styles.cta, { backgroundColor: "#ef4444" }]}
                >
                  <Text style={styles.ctaTextDark}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 20 },
  heading: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 12 },
  card: { flex: 1, backgroundColor: "rgba(255,255,255,0.28)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", borderRadius: 18, overflow: "hidden" },
  img: { width: "100%", aspectRatio: 4/3, backgroundColor: "rgba(255,255,255,0.6)" },
  noImg: { alignItems: "center", justifyContent: "center" },
  caption: { padding: 10, gap: 4, backgroundColor: "rgba(255,255,255,0.92)" },
  captionTitle: { color: "#1a1330", fontWeight: "800" },
  captionDate: { color: "#6b5a9d", fontSize: 12 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 16 },
  modalCard: { borderRadius: 18, backgroundColor: "#fff", padding: 14 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalTitle: { flex: 1, fontWeight: "800", color: "#1a1330", fontSize: 16 },
  modalDate: { color: "#6b5a9d", marginTop: 4, marginBottom: 10 },
  modalImg: { width: "100%", height: 320, borderRadius: 12, backgroundColor: "#eee" },
  cta: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  ctaTextDark: { color: "#000", fontWeight: "800" },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.06)" },
});
