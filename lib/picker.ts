import { Idea, LoveLang, Prefs, Recipient, Tag } from "../types";
import { IDEAS } from "./ideas";

function getLangsForRecipient(p: Prefs, r: Recipient, kidId?: string): LoveLang[] {
  if (r === "spouse" && p.spouseLoveLanguages?.length) return p.spouseLoveLanguages;
  if (r === "kid" && kidId && p.kidsLoveLanguages?.[kidId]?.length) return p.kidsLoveLanguages[kidId]!;
  // For "family" or fallback:
  return p.loveLanguages || [];
}

export function pickIdea(p: Prefs, recipient: Recipient, kidId?: string): Idea {
  const avoid = new Set(p.lastShownIds || []);
  const pool = IDEAS.filter(i => i.recipient === recipient);

  const want: Tag[] = [p.timeBudget, p.moneyBudget, ...getLangsForRecipient(p, recipient, kidId)];
  const score = (i: Idea) => i.tags.reduce((acc, t) => acc + (want.includes(t) ? 1 : 0), 0);

  let ranked = pool.filter(i => !avoid.has(i.id)).sort((a,b)=>score(b)-score(a));
  if (ranked.length === 0) ranked = pool.sort((a,b)=>score(b)-score(a));
  if (p.faithMode) ranked.sort((a,b)=>Number(!!b.faith)-Number(!!a.faith));
  return ranked[0] ?? pool[0];
}
