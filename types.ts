export type Recipient = "spouse" | "kid" | "family";
export type LoveLang = "time" | "words" | "gifts" | "service" | "touch";
export type Tag =
  | LoveLang
  | "budget:$" | "budget:$$"
  | "5min" | "15min" | "30min"
  | "home" | "out";

export type Idea = {
  id: string;
  // Use {{spouse}}, {{kid}}, {{family}} placeholders for personalization
  text: string;
  recipient: Recipient;
  tags: Tag[];
  faith?: { verse: string; ref: string };
};

export type Profiles = {
  spouse?: { name: string };
  kids: { id: string; name: string }[];
};

export type Prefs = {
  profiles: Profiles;
  loveLanguages: LoveLang[];               // global fallback
  spouseLoveLanguages?: LoveLang[];        // per spouse
  kidsLoveLanguages?: Record<string, LoveLang[]>; // per-kid by id
  timeBudget: "5min" | "15min" | "30min";
  moneyBudget: "budget:$" | "budget:$$";
  faithMode: boolean;
  remindAt: string; // "08:00"
  lastShownIds: string[];
};

export type Moment = {
  id: string;
  ts: number;
  ideaId: string;
  recipient: "spouse" | "kid" | "family";
  kidId?: string;
  text: string;
  photoUri?: string;
  note?: string;
};
