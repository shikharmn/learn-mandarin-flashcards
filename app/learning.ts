export type RawCard = {
  unit: number;
  unitTitle: string;
  chinese: string;
  pinyin: string;
  meaning: string;
};

export type LearningCard = {
  id: string;
  units: number[];
  unitTitles: string[];
  chinese: string;
  pinyin: string;
  meanings: string[];
  acceptedEnglish: string[];
};

export type QueueStage = "mcq" | "typing";
export type ChunkPhase = "learn" | "chunk-review" | "cumulative-review";

export type QueueItem = {
  cardId: string;
  stage: QueueStage;
  typedStreak: 0 | 1;
  typedMisses: 0 | 1;
  factShown: boolean;
};

export type ChunkSession = {
  unit: number;
  chunkSize: number;
  chunkIndex: number;
  phase: ChunkPhase;
  chunkCardIds: string[];
  initialCount: number;
  queue: QueueItem[];
  stats: {
    attempts: number;
    fullCorrect: number;
    halfPinyin: number;
  };
};

export type QueueOutcome = {
  correct: boolean;
  pinyinScore?: 0 | 0.5 | 1;
};

const EXTRA_ALIASES: Record<string, string[]> = {
  冰: ["cold", "with ice"],
  美国: ["US", "USA", "the United States", "the United States of America"],
  韩国: ["Republic of Korea"],
  中国人: ["Chinese", "a Chinese person"],
  对不对: ["is that right", "is this right", "correct or not"],
  英语: ["English"],
  中文: ["Chinese", "Mandarin", "written Chinese"],
  数学: ["math", "maths"],
  大学生: ["college student", "university pupil"],
  中学生: ["secondary school student", "high school student"],
  英国: ["UK", "Great Britain"],
  加拿大: ["CA"],
  的: ["possessive particle", "modifier particle", "possessive marker"],
  吗: ["question particle", "yes or no question particle"],
  饭馆: ["dining place", "eatery"],
  书店: ["book shop"],
  超市: ["grocery store", "grocery"],
  零食: ["snack", "snack food"],
  奶茶: ["tea with milk"],
  谢谢: ["thanks", "thanks a lot"],
  不客气: ["no problem", "don't mention it"],
  手机: ["cell phone", "cellphone", "phone", "smartphone"],
  钱包: ["purse"],
  洗手间: ["toilet", "washroom", "loo"],
  在: ["at", "in", "be at", "be in", "located at"],
  火车: ["railway train"],
  车票: ["train ticket", "travel ticket"],
  行李: ["baggage"],
  第一: ["number 1", "1st"],
  一个: ["one", "one item", "one person", "a"],
  同学: ["fellow student", "schoolmate"],
  你好: ["hi", "hello there"],
  历史: ["the past"],
  们: ["plural suffix", "plural marker"],
  篮球: ["basket ball"],
  排球: ["volley ball"],
  跑步: ["jogging", "jog", "run"],
  健身房: ["gymnasium", "fitness center", "fitness centre"],
  运动: ["sports", "workout", "physical exercise"],
  有: ["have", "has", "there is", "there are"],
  还是: ["or", "alternative-question or"],
  "A和B都…": ["both A and B", "A and B both"],
};

export const parseCsv = (text: string): RawCard[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.slice(1).map(([unit, unitTitle, chinese, pinyin, meaning]) => ({
    unit: Number(unit.replace(/^\uFEFF/, "")),
    unitTitle,
    chinese,
    pinyin,
    meaning,
  }));
};

const splitMeaning = (meaning: string) => {
  const variants = new Set([meaning]);
  meaning.split(/\s+\/\s+|;/).forEach((part) => variants.add(part.trim()));

  const withoutNote = meaning.replace(/,\s*(before|for|as in).*$/i, "").trim();
  if (withoutNote !== meaning) variants.add(withoutNote);

  if (/^to\s+/i.test(meaning)) variants.add(meaning.replace(/^to\s+/i, ""));
  return [...variants].filter(Boolean);
};

const basePinyin = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[üv]/g, "u")
    .replace(/[^a-z]/g, "");

export const mergeCards = (rows: RawCard[]): LearningCard[] => {
  const merged = new Map<string, LearningCard>();

  rows.forEach((row) => {
    const id = `${row.chinese}::${basePinyin(row.pinyin)}`;
    const existing = merged.get(id);
    const variants = [...splitMeaning(row.meaning), ...(EXTRA_ALIASES[row.chinese] ?? [])];

    if (existing) {
      if (!existing.units.includes(row.unit)) existing.units.push(row.unit);
      if (!existing.unitTitles.includes(row.unitTitle)) existing.unitTitles.push(row.unitTitle);
      if (!existing.meanings.includes(row.meaning)) existing.meanings.push(row.meaning);
      variants.forEach((variant) => {
        if (!existing.acceptedEnglish.includes(variant)) existing.acceptedEnglish.push(variant);
      });
      return;
    }

    merged.set(id, {
      id,
      units: [row.unit],
      unitTitles: [row.unitTitle],
      chinese: row.chinese,
      pinyin: row.pinyin,
      meanings: [row.meaning],
      acceptedEnglish: [...new Set(variants)],
    });
  });

  return [...merged.values()];
};

const toneMarks: Record<string, string[]> = {
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};

const markSyllable = (syllable: string, tone: number) => {
  const normalized = syllable.replace(/u:|v/g, "ü");
  if (tone === 5 || tone === 0) return normalized;

  const lower = normalized.toLowerCase();
  let index = lower.indexOf("a");
  if (index < 0) index = lower.indexOf("e");
  if (index < 0 && lower.includes("ou")) index = lower.indexOf("o");
  if (index < 0) {
    for (let i = lower.length - 1; i >= 0; i -= 1) {
      if ("aeiouü".includes(lower[i])) {
        index = i;
        break;
      }
    }
  }
  if (index < 0) return normalized;

  const vowel = lower[index];
  const marked = toneMarks[vowel]?.[tone] ?? vowel;
  return `${normalized.slice(0, index)}${marked}${normalized.slice(index + 1)}`;
};

const numberedToMarked = (value: string) =>
  value
    .toLowerCase()
    .replace(/([a-züv:]+)([1-5])/g, (_, syllable: string, tone: string) =>
      markSyllable(syllable, Number(tone)),
    );

const canonicalMarkedPinyin = (value: string) =>
  numberedToMarked(value)
    .normalize("NFC")
    .replace(/u:/g, "ü")
    .replace(/[^a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/gi, "")
    .toLowerCase();

const hasToneInformation = (value: string) =>
  /[1-5āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(value);

export const scorePinyin = (answer: string, expected: string): 0 | 0.5 | 1 => {
  const markedAnswer = canonicalMarkedPinyin(answer.trim());
  const markedExpected = canonicalMarkedPinyin(expected);
  if (markedAnswer === markedExpected) return 1;
  if (basePinyin(answer) === basePinyin(expected) && !hasToneInformation(answer)) return 0.5;
  return 0;
};

const normalizeEnglish = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/you['’]re/g, "you are")
    .replace(/don['’]t/g, "do not")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(a|an|the|to)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (a: string, b: string) => {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
};

const singularize = (value: string) =>
  value
    .split(" ")
    .map((word) => (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word))
    .join(" ");

export const isEnglishCorrect = (answer: string, variants: string[]) => {
  const normalized = normalizeEnglish(answer);
  if (!normalized) return false;

  return variants.some((variant) => {
    const target = normalizeEnglish(variant);
    if (normalized === target || singularize(normalized) === singularize(target)) return true;
    const allowance = target.length >= 10 ? 2 : target.length >= 5 ? 1 : 0;
    return Math.abs(normalized.length - target.length) <= allowance &&
      levenshtein(normalized, target) <= allowance;
  });
};

export const buildMcqOptions = (
  correct: LearningCard,
  candidates: LearningCard[],
  count = 4,
) => {
  const distractors = candidates
    .filter((card) => card.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(count - 1, 0));
  return [correct, ...distractors].sort(() => Math.random() - 0.5);
};

export const advanceChunkSession = (
  session: ChunkSession,
  outcome: QueueOutcome,
): ChunkSession => {
  const current = session.queue[0];
  if (!current) return session;

  const remaining = session.queue.slice(1);
  const updated = { ...current };

  if (session.phase !== "learn") {
    if (!outcome.correct) remaining.push(updated);
  } else if (current.stage === "mcq") {
    if (outcome.correct) {
      updated.stage = "typing";
      updated.typedStreak = 0;
      updated.typedMisses = 0;
    }
    remaining.push(updated);
  } else if (outcome.correct && current.typedStreak === 1) {
    // The second consecutive correct typed answer removes the card.
  } else if (outcome.correct) {
    updated.typedStreak = 1;
    updated.typedMisses = 0;
    updated.factShown = true;
    remaining.push(updated);
  } else if (current.typedMisses === 1) {
    updated.stage = "mcq";
    updated.typedStreak = 0;
    updated.typedMisses = 0;
    remaining.push(updated);
  } else {
    updated.typedStreak = 0;
    updated.typedMisses = 1;
    remaining.push(updated);
  }

  return {
    ...session,
    queue: remaining,
    stats: {
      ...session.stats,
      attempts: session.stats.attempts + 1,
      fullCorrect: session.stats.fullCorrect + (outcome.correct ? 1 : 0),
      halfPinyin: session.stats.halfPinyin + (outcome.pinyinScore === 0.5 ? 1 : 0),
    },
  };
};

export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const computeStreak = (dates: string[], today = new Date()) => {
  const studied = new Set(dates);
  let cursor = today;
  if (!studied.has(localDateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (studied.has(localDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
};

export const recentDays = (count: number, today = new Date()) =>
  Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i - count + 1);
    return {
      key: localDateKey(date),
      label: new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(date),
    };
  });

export const readJson = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Study state remains usable in memory if browser storage is unavailable.
  }
};
