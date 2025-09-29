import { Idea } from "../types";

export const IDEAS: Idea[] = [
  /** -------------------- SPOUSE (12) -------------------- */
  {
    id: "s1",
    text: "Text {{spouse}} one specific thing you admire about them.",
    recipient: "spouse",
    tags: ["words","5min","home","budget:$"],
    faith: { verse: "Love is patient and kind.", ref: "1 Cor 13:4" },
  },
  {
    id: "s2",
    text: "Set {{spouse}}’s coffee or water ready with a sticky note: “I’m in your corner.”",
    recipient: "spouse",
    tags: ["service","5min","home","budget:$"],
  },
  {
    id: "s3",
    text: "Schedule a 30-min ‘phones-away’ chat with {{spouse}} tonight—ask, listen, reflect.",
    recipient: "spouse",
    tags: ["time","30min","home"],
  },
  {
    id: "s4",
    text: "Write a short gratitude list about {{spouse}} (3 lines) and leave it on their pillow.",
    recipient: "spouse",
    tags: ["words","5min","home","budget:$"],
  },
  {
    id: "s5",
    text: "Take over one of {{spouse}}’s chores today without being asked.",
    recipient: "spouse",
    tags: ["service","15min","home"],
  },
  {
    id: "s6",
    text: "Give {{spouse}} a 3-minute back rub or shoulder squeeze while asking about their day.",
    recipient: "spouse",
    tags: ["touch","time","5min","home"],
  },
  {
    id: "s7",
    text: "Plan a quick surprise treat for {{spouse}} (tea, favorite snack) and deliver it warmly.",
    recipient: "spouse",
    tags: ["gifts","5min","home","budget:$"],
  },
  {
    id: "s8",
    text: "Invite {{spouse}} for a 15-minute walk—no phones, just presence.",
    recipient: "spouse",
    tags: ["time","15min","out","budget:$"],
  },
  {
    id: "s9",
    text: "Send {{spouse}} an encouraging meme or photo from your shared memories.",
    recipient: "spouse",
    tags: ["words","5min","home","budget:$"],
  },
  {
    id: "s10",
    text: "Ask {{spouse}}: “What’s one small thing I can take off your plate this week?” Then do it.",
    recipient: "spouse",
    tags: ["service","time","15min","home"],
  },
  {
    id: "s11",
    text: "Choose a worship/feel-good playlist and play one song while you two slow-dance in the kitchen.",
    recipient: "spouse",
    tags: ["touch","time","5min","home","budget:$"],
    faith: { verse: "Do everything in love.", ref: "1 Cor 16:14" },
  },
  {
    id: "s12",
    text: "Write a one-sentence blessing for {{spouse}} and text it midday.",
    recipient: "spouse",
    tags: ["words","5min","home","budget:$"],
    faith: { verse: "The Lord bless you and keep you.", ref: "Num 6:24" },
  },

  /** -------------------- KIDS (12) -------------------- */
  {
    id: "k1",
    text: "Give {{kid}} a 3-minute full-attention hug and ask one question about their day.",
    recipient: "kid",
    tags: ["touch","words","5min","home"],
  },
  {
    id: "k2",
    text: "Plan a quick ‘{{kid}}’s choice’ mini-walk after dinner.",
    recipient: "kid",
    tags: ["time","15min","out","budget:$"],
  },
  {
    id: "k3",
    text: "Slip a lunchbox note for {{kid}}: one strength you see in them.",
    recipient: "kid",
    tags: ["words","5min","home","budget:$"],
  },
  {
    id: "k4",
    text: "Build a 10-minute fortress, Lego scene, or doodle with {{kid}}—let them lead.",
    recipient: "kid",
    tags: ["time","15min","home","budget:$"],
  },
  {
    id: "k5",
    text: "Teach {{kid}} a 2-minute breathing exercise; practice it together before bed.",
    recipient: "kid",
    tags: ["time","5min","home","budget:$"],
  },
  {
    id: "k6",
    text: "Read a short story to {{kid}} in a playful voice.",
    recipient: "kid",
    tags: ["time","15min","home","budget:$"],
  },
  {
    id: "k7",
    text: "Let {{kid}} pick a song and do a silly dance party in the living room.",
    recipient: "kid",
    tags: ["time","15min","home","budget:$"],
  },
  {
    id: "k8",
    text: "Prepare {{kid}} a simple surprise snack plate in a fun shape.",
    recipient: "kid",
    tags: ["gifts","service","15min","home","budget:$"],
  },
  {
    id: "k9",
    text: "Ask {{kid}}: “What are you proud of today?” Celebrate their answer.",
    recipient: "kid",
    tags: ["words","time","5min","home","budget:$"],
  },
  {
    id: "k10",
    text: "Teach {{kid}} a tiny skill (tie a knot, fold a shirt, measure ingredients).",
    recipient: "kid",
    tags: ["time","service","15min","home","budget:$"],
  },
  {
    id: "k11",
    text: "Pray a short blessing over {{kid}} at bedtime (one sentence).",
    recipient: "kid",
    tags: ["words","time","5min","home","budget:$"],
    faith: { verse: "Let the little children come to me.", ref: "Matt 19:14" },
  },
  {
    id: "k12",
    text: "Create a secret handshake with {{kid}} (3–5 moves).",
    recipient: "kid",
    tags: ["touch","time","5min","home","budget:$"],
  },

  /** -------------------- FAMILY (12) -------------------- */
  {
    id: "f1",
    text: "Plan a tech-free 20-minute board/card game with {{family}} tonight.",
    recipient: "family",
    tags: ["time","15min","home","budget:$"],
  },
  {
    id: "f2",
    text: "Cook or prep a simple dessert together with {{family}} after dinner.",
    recipient: "family",
    tags: ["time","30min","home","service"],
  },
  {
    id: "f3",
    text: "Take a neighborhood walk with {{family}} and each share one ‘high & low’ from the day.",
    recipient: "family",
    tags: ["time","15min","out","budget:$"],
  },
  {
    id: "f4",
    text: "Make a gratitude jar with {{family}}; everyone adds one note today.",
    recipient: "family",
    tags: ["words","service","15min","home","budget:$"],
  },
  {
    id: "f5",
    text: "Start a ‘family playlist’; add one song per person and play the first three together.",
    recipient: "family",
    tags: ["time","15min","home","budget:$"],
  },
  {
    id: "f6",
    text: "Create a 10-minute tidy-up sprint with {{family}} and celebrate with a group high-five.",
    recipient: "family",
    tags: ["service","time","15min","home","budget:$"],
  },
  {
    id: "f7",
    text: "Plan a ‘kindness mission’ for {{family}}—write a note or draw for a neighbor/teacher.",
    recipient: "family",
    tags: ["service","words","15min","home","budget:$"],
  },
  {
    id: "f8",
    text: "Read a short Psalm/quote together with {{family}} and share one thought each.",
    recipient: "family",
    tags: ["time","words","15min","home","budget:$"],
    faith: { verse: "Your word is a lamp to my feet.", ref: "Ps 119:105" },
  },
  {
    id: "f9",
    text: "Do a 5-minute stretch or breathing session as {{family}}—everyone teaches one move.",
    recipient: "family",
    tags: ["time","5min","home","budget:$"],
  },
  {
    id: "f10",
    text: "Build a 10-minute photo challenge: each person snaps one picture of ‘joy’ to share.",
    recipient: "family",
    tags: ["time","15min","home","budget:$"],
  },
  {
    id: "f11",
    text: "Plan this weekend’s micro-adventure (30-60 min) with {{family}}—brainstorm 3 ideas.",
    recipient: "family",
    tags: ["time","30min","home","budget:$"],
  },
  {
    id: "f12",
    text: "Circle up and pray one sentence each for the week as {{family}}.",
    recipient: "family",
    tags: ["words","time","5min","home","budget:$"],
    faith: { verse: "As for me and my house, we will serve the Lord.", ref: "Josh 24:15" },
  },

  /** -------------------- BONUS (spouse/kid mix) -------------------- */
  {
    id: "s13",
    text: "Send {{spouse}} a throwback photo and one line about why that moment mattered.",
    recipient: "spouse",
    tags: ["words","5min","home","budget:$"],
  },
  {
    id: "k13",
    text: "Let {{kid}} teach you something they love for 5 minutes.",
    recipient: "kid",
    tags: ["time","words","5min","home","budget:$"],
  },
  {
    id: "f13",
    text: "Create a 3-item ‘wish list’ for family time this month with {{family}}.",
    recipient: "family",
    tags: ["time","words","15min","home","budget:$"],
  },
];
