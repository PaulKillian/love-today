import { Idea, Prefs } from "../types";

export function pickKidName(p: Prefs, kidId?: string) {
  const list = p.profiles?.kids ?? [];
  if (list.length === 0) return { name: "your child" };
  if (kidId) {
    const k = list.find(x => x.id === kidId);
    if (k) return { id: k.id, name: k.name };
  }
  return list[0];
}

function familyLabel(p: Prefs) {
  const spouse = p.profiles?.spouse?.name;
  const kids = (p.profiles?.kids ?? []).map(k => k.name);
  const parts = [spouse, ...kids].filter(Boolean) as string[];
  if (parts.length === 0) return "your family";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} & family`;
}

export function renderIdeaText(idea: Idea, prefs: Prefs, opts?: { kidId?: string }): string {
  const spouseName = prefs.profiles?.spouse?.name || "your spouse";
  const kid = pickKidName(prefs, opts?.kidId);
  return idea.text
    .replaceAll("{{spouse}}", spouseName)
    .replaceAll("{{kid}}", kid.name)
    .replaceAll("{{family}}", familyLabel(prefs));
}
