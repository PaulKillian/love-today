// lib/moments.ts
import { Platform } from "react-native";
// Keep legacy import to avoid SDK 51 deprecation crash for old API names.
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Moment } from "../types";

const KEY = "moments";
const DIR = FileSystem.documentDirectory + "moments/";

// ---------- helpers ----------
async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
    }
  } catch (e) {
    console.warn("ensureDir error:", e);
  }
}

/** Turn any URI into a persistent data URL (web only). */
async function toDataURLWeb(uri: string): Promise<string> {
  // On web, ImagePicker often returns a blob: URL that won't survive reloads.
  const res = await fetch(uri);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    try {
      const fr = new FileReader();
      fr.onerror = () => reject(fr.error);
      fr.onloadend = () => resolve(String(fr.result));
      fr.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

export async function getMoments(): Promise<Moment[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const list: Moment[] = raw ? JSON.parse(raw) : [];
  return list.sort((a, b) => b.ts - a.ts);
}

async function saveMoments(list: Moment[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function addMoment(
  m: Omit<Moment, "id" | "ts" | "photoUri"> & { photoTempUri?: string }
): Promise<Moment> {
  let photoUri: string | undefined;

  if (m.photoTempUri) {
    if (Platform.OS === "web") {
      // Persist as data URL so it survives reloads & <Image/> can render it.
      photoUri = await toDataURLWeb(m.photoTempUri);
    } else {
      await ensureDir();
      // Some URIs have no extension; default to jpg
      const ext = (m.photoTempUri.split("?")[0].split(".").pop() || "jpg")
        .toString()
        .toLowerCase();
      const idPart = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const dest = `${DIR}${idPart}.${ext}`;
      await FileSystem.copyAsync({ from: m.photoTempUri, to: dest });
      photoUri = dest;
    }
  }

  const rec: Moment = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    ideaId: m.ideaId,
    recipient: m.recipient,
    kidId: m.kidId,
    text: m.text,
    note: m.note,
    photoUri,
  };

  const list = await getMoments();
  list.unshift(rec);
  await saveMoments(list);
  return rec;
}

export async function removeMoment(id: string) {
  const list = await getMoments();
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) {
    const [rm] = list.splice(idx, 1);
    if (rm?.photoUri && Platform.OS !== "web") {
      try {
        await FileSystem.deleteAsync(rm.photoUri, { idempotent: true });
      } catch {}
    }
    await saveMoments(list);
  }
}

export async function clearAllMoments() {
  await saveMoments([]);
  if (Platform.OS !== "web") {
    try {
      await FileSystem.deleteAsync(DIR, { idempotent: true });
    } catch {}
  }
}
