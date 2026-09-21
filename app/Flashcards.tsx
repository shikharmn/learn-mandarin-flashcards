"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Card = {
  unit: number;
  unitTitle: string;
  chinese: string;
  pinyin: string;
  meaning: string;
};

type Mode = "hanzi" | "pinyin";
type Result = "incorrect" | "correct";
type CardHistory = Record<string, { seen: boolean; wasWrong: boolean }>;

const HISTORY_KEY = "zika-card-history-v1";

const cardKey = (card: Card) =>
  `${card.unit}|${card.chinese}|${card.pinyin}|${card.meaning}`;

const readHistory = (): CardHistory => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "{}");
  } catch {
    localStorage.removeItem(HISTORY_KEY);
    return {};
  }
};

const parseCsv = (text: string): Card[] => {
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

const cardWeight = (card: Card, history: CardHistory) => {
  const record = history[cardKey(card)];
  if (!record?.seen) return 4;
  if (record.wasWrong) return 2;
  return 1;
};

const pickWeightedIndex = (cards: Card[], history: CardHistory) => {
  if (!cards.length) return 0;
  const totalWeight = cards.reduce((total, card) => total + cardWeight(card, history), 0);
  let draw = Math.random() * totalWeight;

  for (let i = 0; i < cards.length; i += 1) {
    draw -= cardWeight(cards[i], history);
    if (draw < 0) return i;
  }

  return cards.length - 1;
};

export function Flashcards() {
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [mode, setMode] = useState<Mode>("hanzi");
  const [unit, setUnit] = useState(0);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [history, setHistory] = useState<CardHistory>(readHistory);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const savedHistory = readHistory();

    fetch("/vocabulary.csv")
      .then((response) => response.text())
      .then((text) => {
        const cards = parseCsv(text);
        setAllCards(cards);
        setDeck(cards);
        setIndex(pickWeightedIndex(cards, savedHistory));
      });
  }, []);

  const filtered = useMemo(
    () => (unit === 0 ? allCards : allCards.filter((card) => card.unit === unit)),
    [allCards, unit],
  );

  const current = deck[index];
  const accuracy = reviewed ? Math.round((correct / reviewed) * 100) : 0;
  const seen = allCards.filter((card) => history[cardKey(card)]?.seen).length;
  const seenInDeck = deck.filter((card) => history[cardKey(card)]?.seen).length;

  const resetDeck = useCallback(
    (nextUnit = unit) => {
      const source = nextUnit === 0 ? allCards : allCards.filter((card) => card.unit === nextUnit);
      setDeck(source);
      setIndex(pickWeightedIndex(source, history));
      setRevealed(false);
      setShowHint(false);
    },
    [allCards, history, unit],
  );

  const chooseUnit = (nextUnit: number) => {
    setUnit(nextUnit);
    resetDeck(nextUnit);
  };

  const recordResult = useCallback(
    (result: Result) => {
      if (!current || !revealed) return;
      setReviewed((count) => count + 1);
      if (result === "correct") setCorrect((count) => count + 1);

      const key = cardKey(current);
      const nextHistory = {
        ...history,
        [key]: {
          seen: true,
          wasWrong: history[key]?.wasWrong || result === "incorrect",
        },
      };
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      setRevealed(false);
      setShowHint(false);
      setIndex(pickWeightedIndex(deck, nextHistory));
    },
    [current, deck, history, revealed],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isLibraryOpen || event.target instanceof HTMLInputElement) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        setRevealed((value) => !value);
      }
      if (event.key === "1") recordResult("incorrect");
      if (event.key === "2") recordResult("correct");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLibraryOpen, recordResult]);

  const libraryCards = filtered.filter((card) => {
    const term = query.toLowerCase();
    return `${card.chinese} ${card.pinyin} ${card.meaning}`.toLowerCase().includes(term);
  });

  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Zika home">
          <span className="seal">字</span>
          <span>
            <strong>字卡</strong>
            <small>zì kǎ · character cards</small>
          </span>
        </a>
        <nav aria-label="Study controls">
          <button className="text-button" onClick={() => setIsLibraryOpen(true)}>
            Vocabulary <span>{allCards.length}</span>
          </button>
          <button className="shuffle-button" onClick={() => resetDeck()}>
            Shuffle deck
          </button>
        </nav>
      </header>

      <section className="workspace" id="top">
        <aside className="side-panel left-panel">
          <p className="eyebrow">Study set</p>
          <h1>Section 1</h1>
          <p className="intro">Your complete Duolingo vocabulary, recast for active recall.</p>

          <label htmlFor="unit-select">Unit focus</label>
          <div className="select-wrap">
            <select id="unit-select" value={unit} onChange={(event) => chooseUnit(Number(event.target.value))}>
              <option value={0}>All 10 units</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Unit {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="streak-block">
            <div className="streak-heading"><span>7 day rhythm</span><strong>3</strong></div>
            <div className="week" aria-label="Three day study streak">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={`${day}-${i}`} className={i < 3 ? "active" : ""}>
                  <i />
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="key-hint"><kbd>Space</kbd> reveal · <kbd>1–2</kbd> answer</p>
        </aside>

        <section className="study-stage" aria-live="polite">
          <div className="mode-switch" aria-label="Flashcard direction">
            <button className={mode === "hanzi" ? "selected" : ""} onClick={() => { setMode("hanzi"); setRevealed(false); setShowHint(false); }}>
              汉字 <span>Hanzi → meaning</span>
            </button>
            <button className={mode === "pinyin" ? "selected" : ""} onClick={() => { setMode("pinyin"); setRevealed(false); setShowHint(false); }}>
              Pīnyīn <span>Pinyin → meaning</span>
            </button>
          </div>

          {current ? (
            <>
              <div className="card-toolbar">
                <span className={showHint ? "unit-label visible" : "unit-label"} aria-live="polite">
                  {showHint ? `Unit ${current.unit} · ${current.unitTitle}` : ""}
                </span>
                <button
                  className="hint-button"
                  onClick={() => setShowHint((value) => !value)}
                  aria-expanded={showHint}
                >
                  {showHint ? "Hide hint" : "Hint"}
                </button>
              </div>
              <button className={`flashcard ${revealed ? "revealed" : ""}`} onClick={() => setRevealed((value) => !value)} aria-label={revealed ? "Hide answer" : "Reveal answer"}>
                <span className="card-corner">{String(current.unit).padStart(2, "0")}</span>
                <span className={mode === "hanzi" ? "hanzi" : "pinyin-prompt"}>
                  {mode === "hanzi" ? current.chinese : current.pinyin}
                </span>
                <span className="answer-block" aria-hidden={!revealed}>
                  {revealed && (
                    <>
                      {mode === "hanzi" && <em>{current.pinyin}</em>}
                      <strong>{current.meaning}</strong>
                    </>
                  )}
                </span>
                <span className="reveal-cue">{revealed ? "tap to hide" : "tap or press space to reveal"}</span>
              </button>

              <div className="grade-row" aria-label="Record your answer">
                <button disabled={!revealed} onClick={() => recordResult("incorrect")} className="incorrect">
                  <kbd>1</kbd><span>Incorrect</span>
                </button>
                <button disabled={!revealed} onClick={() => recordResult("correct")} className="correct">
                  <kbd>2</kbd><span>Correct</span>
                </button>
              </div>
            </>
          ) : (
            <div className="loading-card">Preparing your cards…</div>
          )}

          <div className="deck-progress">
            <span>{seenInDeck} / {deck.length} seen</span>
            <div><i style={{ width: `${deck.length ? (seenInDeck / deck.length) * 100 : 0}%` }} /></div>
            <span>{unit ? `Unit ${unit}` : "All units"}</span>
          </div>
        </section>

        <aside className="side-panel right-panel">
          <p className="eyebrow">Today</p>
          <div className="stat"><strong>{reviewed}</strong><span>reviewed</span></div>
          <div className="stat"><strong>{accuracy}<sup>%</sup></strong><span>accuracy</span></div>
          <div className="stat"><strong>{seen}</strong><span>cards seen</span></div>

          <div className="ink-note">
            <span>记住</span>
            <p>New cards appear most often. Cards you miss return more frequently.</p>
          </div>
        </aside>
      </section>

      <footer>
        <span>Section 1 · {allCards.length} vocabulary entries</span>
        <span>Made for deliberate practice</span>
      </footer>

      {isLibraryOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setIsLibraryOpen(false)}>
          <aside className="library-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="Vocabulary library">
            <div className="drawer-head">
              <div><p className="eyebrow">Full collection</p><h2>Vocabulary</h2></div>
              <button onClick={() => setIsLibraryOpen(false)} aria-label="Close vocabulary">×</button>
            </div>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Hanzi, pinyin, or meaning…" />
            <div className="word-list">
              {libraryCards.map((card, i) => (
                <article key={`${card.unit}-${card.chinese}-${i}`}>
                  <span className="word-hanzi">{card.chinese}</span>
                  <span><strong>{card.pinyin}</strong><small>{card.meaning}</small></span>
                  <i>U{card.unit}</i>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
