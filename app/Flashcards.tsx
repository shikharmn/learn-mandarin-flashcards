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
type Grade = "again" | "good" | "easy";

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

const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const gradeLabel: Record<Grade, string> = {
  again: "Again",
  good: "Good",
  easy: "Easy",
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
  const [mastered, setMastered] = useState<string[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/vocabulary.csv")
      .then((response) => response.text())
      .then((text) => {
        const cards = parseCsv(text);
        setAllCards(cards);
        setDeck(shuffle(cards));
      });
  }, []);

  const filtered = useMemo(
    () => (unit === 0 ? allCards : allCards.filter((card) => card.unit === unit)),
    [allCards, unit],
  );

  const current = deck[index];
  const accuracy = reviewed ? Math.round((correct / reviewed) * 100) : 0;

  const resetDeck = useCallback(
    (nextUnit = unit) => {
      const source = nextUnit === 0 ? allCards : allCards.filter((card) => card.unit === nextUnit);
      setDeck(shuffle(source));
      setIndex(0);
      setRevealed(false);
      setShowHint(false);
    },
    [allCards, unit],
  );

  const chooseUnit = (nextUnit: number) => {
    setUnit(nextUnit);
    resetDeck(nextUnit);
  };

  const grade = useCallback(
    (value: Grade) => {
      if (!current || !revealed) return;
      setReviewed((count) => count + 1);
      if (value !== "again") setCorrect((count) => count + 1);
      if (value === "easy") {
        setMastered((items) =>
          items.includes(current.chinese) ? items : [...items, current.chinese],
        );
      }
      setRevealed(false);
      setShowHint(false);
      setIndex((position) => (position + 1) % Math.max(deck.length, 1));
    },
    [current, deck.length, revealed],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isLibraryOpen || event.target instanceof HTMLInputElement) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        setRevealed((value) => !value);
      }
      if (event.key === "1") grade("again");
      if (event.key === "2") grade("good");
      if (event.key === "3") grade("easy");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [grade, isLibraryOpen]);

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

          <p className="key-hint"><kbd>Space</kbd> reveal · <kbd>1–3</kbd> grade</p>
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

              <div className="grade-row" aria-label="Grade this card">
                {(["again", "good", "easy"] as Grade[]).map((value, i) => (
                  <button key={value} disabled={!revealed} onClick={() => grade(value)} className={value}>
                    <kbd>{i + 1}</kbd><span>{gradeLabel[value]}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="loading-card">Preparing your cards…</div>
          )}

          <div className="deck-progress">
            <span>{deck.length ? index + 1 : 0} / {deck.length}</span>
            <div><i style={{ width: `${deck.length ? ((index + 1) / deck.length) * 100 : 0}%` }} /></div>
            <span>{unit ? `Unit ${unit}` : "All units"}</span>
          </div>
        </section>

        <aside className="side-panel right-panel">
          <p className="eyebrow">Today</p>
          <div className="stat"><strong>{reviewed}</strong><span>reviewed</span></div>
          <div className="stat"><strong>{accuracy}<sup>%</sup></strong><span>accuracy</span></div>
          <div className="stat"><strong>{mastered.length}</strong><span>mastered</span></div>

          <div className="ink-note">
            <span>记住</span>
            <p>Recognition grows through retrieval, not rereading.</p>
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
