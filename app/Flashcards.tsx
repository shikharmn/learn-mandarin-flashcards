"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CharacterFact, getCharacterFact } from "./facts";
import {
  advanceChunkSession,
  buildMcqOptions,
  ChunkSession,
  computeStreak,
  isEnglishCorrect,
  LearningCard,
  localDateKey,
  mergeCards,
  parseCsv,
  readJson,
  recentDays,
  scorePinyin,
  writeJson,
} from "./learning";

type StudyMode = "review" | "chunk";
type Direction = "hanzi" | "pinyin";
type Result = "incorrect" | "correct";
type CardHistory = Record<string, { seen: boolean; wasWrong: boolean }>;
type QuizFeedback = {
  correct: boolean;
  kind: "mcq" | "typing";
  pinyinScore?: 0 | 0.5 | 1;
  englishCorrect?: boolean;
};

type CompletionSummary = ChunkSession["stats"] & {
  unit: number;
  chunkIndex: number;
  chunkSize: number;
};

const HISTORY_KEY = "zika-card-history-v2";
const LEGACY_HISTORY_KEY = "zika-card-history-v1";
const ACTIVITY_KEY = "zika-study-days-v1";
const CHUNK_SESSION_KEY = "zika-chunk-session-v1";
const COMPLETED_CHUNKS_KEY = "zika-completed-chunks-v1";

const readHistory = () => readJson<CardHistory>(HISTORY_KEY, {});

const cardWeight = (card: LearningCard, history: CardHistory) => {
  const record = history[card.id];
  if (!record?.seen) return 4;
  if (record.wasWrong) return 2;
  return 1;
};

const pickWeightedIndex = (cards: LearningCard[], history: CardHistory) => {
  if (!cards.length) return 0;
  const totalWeight = cards.reduce((total, card) => total + cardWeight(card, history), 0);
  let draw = Math.random() * totalWeight;
  for (let i = 0; i < cards.length; i += 1) {
    draw -= cardWeight(cards[i], history);
    if (draw < 0) return i;
  }
  return cards.length - 1;
};

const chunkKey = (unit: number, size: number, index: number) => `${unit}:${size}:${index}`;

const unitCards = (cards: LearningCard[], unit: number) =>
  unit === 0 ? cards : cards.filter((card) => card.units.includes(unit));

const firstIncompleteChunk = (
  cards: LearningCard[],
  unit: number,
  size: number,
  completed: string[],
) => {
  const count = Math.ceil(unitCards(cards, unit).length / size);
  const next = Array.from({ length: count }, (_, index) => index).find(
    (index) => !completed.includes(chunkKey(unit, size, index)),
  );
  return next ?? Math.max(count - 1, 0);
};

const queueLabel = (session: ChunkSession) => {
  const item = session.queue[0];
  if (!item) return "Complete";
  if (item.stage === "mcq") return "Multiple choice";
  if (item.typedStreak === 1) return "Repeat to finish";
  if (item.typedMisses === 1) return "Typing · one miss";
  return "Type the answer";
};

export function Flashcards() {
  const [allCards, setAllCards] = useState<LearningCard[]>([]);
  const [deck, setDeck] = useState<LearningCard[]>([]);
  const [studyMode, setStudyMode] = useState<StudyMode>("review");
  const [direction, setDirection] = useState<Direction>("hanzi");
  const [unit, setUnit] = useState(0);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [history, setHistory] = useState<CardHistory>(readHistory);
  const [activityDates, setActivityDates] = useState<string[]>(() =>
    readJson<string[]>(ACTIVITY_KEY, []),
  );
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [chunkSize, setChunkSize] = useState(5);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [chunkSession, setChunkSession] = useState<ChunkSession | null>(() =>
    readJson<ChunkSession | null>(CHUNK_SESSION_KEY, null),
  );
  const [completedChunks, setCompletedChunks] = useState<string[]>(() =>
    readJson<string[]>(COMPLETED_CHUNKS_KEY, []),
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pinyinAnswer, setPinyinAnswer] = useState("");
  const [englishAnswer, setEnglishAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState<QuizFeedback | null>(null);
  const [factToast, setFactToast] = useState<CharacterFact | null>(null);
  const [completion, setCompletion] = useState<CompletionSummary | null>(null);

  useEffect(() => {
    const savedHistory = readHistory();
    fetch("/vocabulary.csv")
      .then((response) => response.text())
      .then((text) => {
        const cards = mergeCards(parseCsv(text));
        const validIds = new Set(cards.map((card) => card.id));
        let effectiveHistory = savedHistory;

        if (!Object.keys(savedHistory).length) {
          const legacy = readJson<CardHistory>(LEGACY_HISTORY_KEY, {});
          effectiveHistory = Object.fromEntries(
            cards.flatMap((card) => {
              const records = Object.entries(legacy)
                .filter(([key]) => key.split("|")[1] === card.chinese)
                .map(([, value]) => value);
              if (!records.length) return [];
              return [[card.id, {
                seen: records.some((record) => record.seen),
                wasWrong: records.some((record) => record.wasWrong),
              }]];
            }),
          );
          if (Object.keys(effectiveHistory).length) writeJson(HISTORY_KEY, effectiveHistory);
        }

        setAllCards(cards);
        setDeck(cards);
        setHistory(effectiveHistory);
        setIndex(pickWeightedIndex(cards, effectiveHistory));
        setChunkIndex((current) =>
          current || firstIncompleteChunk(cards, 0, 5, readJson(COMPLETED_CHUNKS_KEY, [])),
        );
        setChunkSession((saved) => {
          if (saved?.queue.every((item) => validIds.has(item.cardId))) return saved;
          try {
            localStorage.removeItem(CHUNK_SESSION_KEY);
          } catch {
            // Ignore storage restrictions; the in-memory session is already cleared.
          }
          return null;
        });
      });
  }, []);

  const filtered = useMemo(() => unitCards(allCards, unit), [allCards, unit]);
  const cardMap = useMemo(() => new Map(allCards.map((card) => [card.id, card])), [allCards]);
  const current = deck[index];
  const accuracy = reviewed ? Math.round((correct / reviewed) * 100) : 0;
  const seen = allCards.filter((card) => history[card.id]?.seen).length;
  const seenInDeck = deck.filter((card) => history[card.id]?.seen).length;
  const streak = computeStreak(activityDates);
  const week = recentDays(7);
  const chunkCount = Math.ceil(filtered.length / chunkSize);
  const currentQueueItem = chunkSession?.queue[0];
  const quizCard = currentQueueItem ? cardMap.get(currentQueueItem.cardId) : undefined;
  const optionRound = chunkSession?.stats.attempts ?? 0;

  const mcqOptions = useMemo(() => {
    void optionRound;
    if (!quizCard || currentQueueItem?.stage !== "mcq") return [];
    return buildMcqOptions(quizCard, unitCards(allCards, chunkSession?.unit ?? 0));
  }, [allCards, chunkSession?.unit, currentQueueItem?.stage, optionRound, quizCard]);

  const markStudyDay = useCallback(() => {
    const today = localDateKey();
    setActivityDates((dates) => {
      if (dates.includes(today)) return dates;
      const next = [...dates, today].sort();
      writeJson(ACTIVITY_KEY, next);
      return next;
    });
  }, []);

  const resetReviewDeck = useCallback(
    (nextUnit = unit) => {
      const source = unitCards(allCards, nextUnit);
      setDeck(source);
      setIndex(pickWeightedIndex(source, history));
      setRevealed(false);
      setShowHint(false);
    },
    [allCards, history, unit],
  );

  const chooseUnit = (nextUnit: number) => {
    setUnit(nextUnit);
    resetReviewDeck(nextUnit);
    setChunkIndex(firstIncompleteChunk(allCards, nextUnit, chunkSize, completedChunks));
    setCompletion(null);
  };

  const changeChunkSize = (value: number) => {
    const nextSize = Math.min(20, Math.max(2, value || 2));
    setChunkSize(nextSize);
    setChunkIndex(firstIncompleteChunk(allCards, unit, nextSize, completedChunks));
    setCompletion(null);
  };

  const recordResult = useCallback(
    (result: Result) => {
      if (!current || !revealed) return;
      markStudyDay();
      setReviewed((count) => count + 1);
      if (result === "correct") setCorrect((count) => count + 1);
      const nextHistory = {
        ...history,
        [current.id]: {
          seen: true,
          wasWrong: history[current.id]?.wasWrong || result === "incorrect",
        },
      };
      setHistory(nextHistory);
      writeJson(HISTORY_KEY, nextHistory);
      setRevealed(false);
      setShowHint(false);
      setIndex(pickWeightedIndex(deck, nextHistory));
    },
    [current, deck, history, markStudyDay, revealed],
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        studyMode !== "review" ||
        isLibraryOpen ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        setRevealed((value) => !value);
      }
      if (event.key === "1") recordResult("incorrect");
      if (event.key === "2") recordResult("correct");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isLibraryOpen, recordResult, studyMode]);

  const startChunk = (selectedIndex = chunkIndex) => {
    const source = unitCards(allCards, unit);
    const cards = source.slice(selectedIndex * chunkSize, (selectedIndex + 1) * chunkSize);
    if (!cards.length) return;
    const next: ChunkSession = {
      unit,
      chunkSize,
      chunkIndex: selectedIndex,
      initialCount: cards.length,
      queue: cards.map((card) => ({
        cardId: card.id,
        stage: "mcq",
        typedStreak: 0,
        typedMisses: 0,
        factShown: false,
      })),
      stats: { attempts: 0, fullCorrect: 0, halfPinyin: 0 },
    };
    setChunkSession(next);
    writeJson(CHUNK_SESSION_KEY, next);
    setCompletion(null);
    setQuizFeedback(null);
    setSelectedOption(null);
    setPinyinAnswer("");
    setEnglishAnswer("");
  };

  const submitMcq = (answerId: string) => {
    if (!quizCard || quizFeedback) return;
    setSelectedOption(answerId);
    setQuizFeedback({ kind: "mcq", correct: answerId === quizCard.id });
    markStudyDay();
  };

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    if (!quizCard || !currentQueueItem || quizFeedback) return;
    const pinyinScore = scorePinyin(pinyinAnswer, quizCard.pinyin);
    const englishCorrect = isEnglishCorrect(englishAnswer, quizCard.acceptedEnglish);
    const isCorrect = pinyinScore === 1 && englishCorrect;
    setQuizFeedback({ kind: "typing", correct: isCorrect, pinyinScore, englishCorrect });
    markStudyDay();
    if (isCorrect && !currentQueueItem.factShown) {
      setFactToast(getCharacterFact(quizCard.chinese));
    }
  };

  const continueQuiz = () => {
    if (!chunkSession || !currentQueueItem || !quizFeedback) return;
    const nextSession = advanceChunkSession(chunkSession, quizFeedback);

    if (!nextSession.queue.length) {
      const key = chunkKey(chunkSession.unit, chunkSession.chunkSize, chunkSession.chunkIndex);
      const nextCompleted = completedChunks.includes(key)
        ? completedChunks
        : [...completedChunks, key];
      setCompletedChunks(nextCompleted);
      writeJson(COMPLETED_CHUNKS_KEY, nextCompleted);
      setCompletion({
        ...nextSession.stats,
        unit: chunkSession.unit,
        chunkIndex: chunkSession.chunkIndex,
        chunkSize: chunkSession.chunkSize,
      });
      setChunkSession(null);
      try {
        localStorage.removeItem(CHUNK_SESSION_KEY);
      } catch {
        // The completed session is already cleared in memory.
      }
      const total = Math.ceil(unitCards(allCards, chunkSession.unit).length / chunkSession.chunkSize);
      setChunkIndex(Math.min(chunkSession.chunkIndex + 1, Math.max(total - 1, 0)));
    } else {
      setChunkSession(nextSession);
      writeJson(CHUNK_SESSION_KEY, nextSession);
    }

    setQuizFeedback(null);
    setSelectedOption(null);
    setPinyinAnswer("");
    setEnglishAnswer("");
  };

  const libraryCards = filtered.filter((card) => {
    const term = query.toLowerCase();
    return `${card.chinese} ${card.pinyin} ${card.meanings.join(" ")}`
      .toLowerCase()
      .includes(term);
  });

  const renderReview = () => (
    <>
      <div className="mode-switch" aria-label="Flashcard direction">
        <button
          className={direction === "hanzi" ? "selected" : ""}
          onClick={() => { setDirection("hanzi"); setRevealed(false); setShowHint(false); }}
        >
          汉字 <span>Hanzi → meaning</span>
        </button>
        <button
          className={direction === "pinyin" ? "selected" : ""}
          onClick={() => { setDirection("pinyin"); setRevealed(false); setShowHint(false); }}
        >
          Pīnyīn <span>Pinyin → meaning</span>
        </button>
      </div>

      {current ? (
        <>
          <div className="card-toolbar">
            <span className={showHint ? "unit-label visible" : "unit-label"} aria-live="polite">
              {showHint ? `Unit ${current.units.join(", ")} · ${current.unitTitles.join(" / ")}` : ""}
            </span>
            <button
              className="hint-button"
              onClick={() => setShowHint((value) => !value)}
              aria-expanded={showHint}
            >
              {showHint ? "Hide hint" : "Hint"}
            </button>
          </div>
          <button
            className={`flashcard ${revealed ? "revealed" : ""}`}
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide answer" : "Reveal answer"}
          >
            <span className={direction === "hanzi" ? "hanzi" : "pinyin-prompt"}>
              {direction === "hanzi" ? current.chinese : current.pinyin}
            </span>
            <span className="answer-block" aria-hidden={!revealed}>
              {revealed && (
                <>
                  {direction === "hanzi" && <em>{current.pinyin}</em>}
                  <strong>{current.meanings.join(" · ")}</strong>
                </>
              )}
            </span>
            <span className="reveal-cue">
              {revealed ? "tap to hide" : "tap or press space to reveal"}
            </span>
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
    </>
  );

  const renderChunkSetup = () => {
    if (completion) {
      return (
        <section className="completion-card">
          <p className="eyebrow">Chunk complete</p>
          <h2>Queue cleared.</h2>
          <p>You translated every card correctly twice in a row.</p>
          <div className="completion-stats">
            <span><strong>{completion.attempts}</strong> attempts</span>
            <span><strong>{completion.halfPinyin}</strong> tone reminders</span>
            <span><strong>{completion.fullCorrect}</strong> correct</span>
          </div>
          <button className="primary-action" onClick={() => startChunk(chunkIndex)}>
            Start next chunk
          </button>
          <button className="secondary-action" onClick={() => setCompletion(null)}>
            Choose another chunk
          </button>
        </section>
      );
    }

    return (
      <section className="chunk-setup">
        <p className="eyebrow">Memorization queue</p>
        <h2>Choose a small chunk.</h2>
        <p className="setup-copy">
          Each card starts as multiple choice, then graduates through two consecutive typed answers.
        </p>
        <div className="chunk-controls">
          <label>
            Cards per chunk
            <input
              type="number"
              min="2"
              max="20"
              value={chunkSize}
              onChange={(event) => changeChunkSize(Number(event.target.value))}
            />
          </label>
          <label>
            Chunk
            <select
              value={Math.min(chunkIndex, Math.max(chunkCount - 1, 0))}
              onChange={(event) => { setChunkIndex(Number(event.target.value)); setCompletion(null); }}
            >
              {Array.from({ length: chunkCount }, (_, itemIndex) => (
                <option key={itemIndex} value={itemIndex}>
                  {itemIndex + 1} of {chunkCount}{completedChunks.includes(chunkKey(unit, chunkSize, itemIndex)) ? " · complete" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="chunk-preview" aria-label="Words in this chunk">
          {filtered
            .slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize)
            .map((card) => <span key={card.id}>{card.chinese}</span>)}
        </div>
        <button className="primary-action" onClick={() => startChunk()} disabled={!filtered.length}>
          Start chunk
        </button>
        <p className="tone-note">Tone marks or tone numbers earn full credit. Toneless Pinyin earns half credit and stays in the queue.</p>
      </section>
    );
  };

  const renderChunkQuiz = () => {
    if (!chunkSession || !quizCard || !currentQueueItem) return renderChunkSetup();
    const finished = chunkSession.initialCount - chunkSession.queue.length;
    return (
      <section className="quiz-shell">
        <div className="quiz-meta">
          <span>Chunk {chunkSession.chunkIndex + 1}</span>
          <strong>{queueLabel(chunkSession)}</strong>
          <span>{chunkSession.queue.length} left</span>
        </div>
        <div className="queue-rail" aria-label={`${chunkSession.queue.length} cards in the queue`}>
          {chunkSession.queue.slice(0, 14).map((item, itemIndex) => (
            <i
              key={`${item.cardId}-${itemIndex}`}
              className={`${item.stage} ${item.typedStreak ? "once-correct" : ""} ${item.typedMisses ? "once-incorrect" : ""}`}
            />
          ))}
        </div>

        <article className="quiz-card">
          <span className="quiz-stage-label">{queueLabel(chunkSession)}</span>
          <h2>{quizCard.chinese}</h2>

          {currentQueueItem.stage === "mcq" ? (
            <div className="mcq-grid">
              {mcqOptions.map((option) => {
                const selected = selectedOption === option.id;
                const answer = quizFeedback && option.id === quizCard.id;
                const wrong = quizFeedback && selected && option.id !== quizCard.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => submitMcq(option.id)}
                    disabled={Boolean(quizFeedback)}
                    className={`${answer ? "answer" : ""} ${wrong ? "wrong" : ""}`}
                  >
                    <strong>{option.pinyin}</strong>
                    <span>{option.meanings[0]}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form className="typed-form" onSubmit={submitTyped}>
              <label>
                Pinyin
                <input
                  autoFocus
                  value={pinyinAnswer}
                  onChange={(event) => setPinyinAnswer(event.target.value)}
                  placeholder="e.g. shuǐ or shui3"
                  disabled={Boolean(quizFeedback)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label>
                English meaning
                <input
                  value={englishAnswer}
                  onChange={(event) => setEnglishAnswer(event.target.value)}
                  placeholder="Type a translation"
                  disabled={Boolean(quizFeedback)}
                  autoComplete="off"
                />
              </label>
              {!quizFeedback && <button className="primary-action" type="submit">Check answer</button>}
            </form>
          )}

          {quizFeedback && (
            <div className={`quiz-feedback ${quizFeedback.correct ? "correct" : "incorrect"}`} role="status">
              <strong>{quizFeedback.correct ? "Correct" : "Keep this one in the queue"}</strong>
              {quizFeedback.kind === "typing" && (
                <div className="field-scores">
                  <span>Pinyin: {quizFeedback.pinyinScore === 1 ? "1" : quizFeedback.pinyinScore === 0.5 ? "½ · tones missing" : "0"}</span>
                  <span>Meaning: {quizFeedback.englishCorrect ? "1" : "0"}</span>
                </div>
              )}
              <p><em>{quizCard.pinyin}</em> · {quizCard.meanings.join(" / ")}</p>
              <button className="primary-action" onClick={continueQuiz} autoFocus>
                Continue · Enter
              </button>
            </div>
          )}
        </article>

        <div className="deck-progress quiz-progress">
          <span>{finished} graduated</span>
          <div><i style={{ width: `${(finished / chunkSession.initialCount) * 100}%` }} /></div>
          <span>{chunkSession.stats.attempts} attempts</span>
        </div>
      </section>
    );
  };

  return (
    <main className="app-shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="Zika home">
          <span className="seal">字</span>
          <span><strong>字卡</strong><small>zì kǎ · character cards</small></span>
        </a>
        <nav aria-label="Study controls">
          <button className="text-button" onClick={() => setIsLibraryOpen(true)}>
            Vocabulary <span>{allCards.length}</span>
          </button>
          <span className="streak-chip"><strong>{streak}</strong> day streak</span>
          {studyMode === "review" && (
            <button className="shuffle-button" onClick={() => resetReviewDeck()}>Shuffle deck</button>
          )}
        </nav>
      </header>

      <section className="workspace" id="top">
        <aside className="side-panel left-panel">
          <p className="eyebrow">Study set</p>
          <h1>Section 1</h1>
          <p className="intro">Your Duolingo vocabulary, recast for active recall.</p>
          <label htmlFor="unit-select">Unit focus</label>
          <div className="select-wrap">
            <select
              id="unit-select"
              value={chunkSession && studyMode === "chunk" ? chunkSession.unit : unit}
              disabled={Boolean(chunkSession && studyMode === "chunk")}
              onChange={(event) => chooseUnit(Number(event.target.value))}
            >
              <option value={0}>All 10 units</option>
              {Array.from({ length: 10 }, (_, itemIndex) => (
                <option key={itemIndex + 1} value={itemIndex + 1}>Unit {itemIndex + 1}</option>
              ))}
            </select>
          </div>

          <div className="streak-block">
            <div className="streak-heading"><span>Daily streak</span><strong>{streak}</strong></div>
            <div className="week" aria-label={`${streak} day study streak`}>
              {week.map((day) => (
                <div key={day.key} className={activityDates.includes(day.key) ? "active" : ""}>
                  <i /><span>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="key-hint">
            {studyMode === "review" ? <><kbd>Space</kbd> reveal · <kbd>1–2</kbd> answer</> : "Your queue is saved on this device."}
          </p>
        </aside>

        <section className="study-stage" aria-live="polite">
          <div className="study-mode-tabs" aria-label="Study mode">
            <button className={studyMode === "review" ? "selected" : ""} onClick={() => setStudyMode("review")}>Review</button>
            <button className={studyMode === "chunk" ? "selected" : ""} onClick={() => setStudyMode("chunk")}>Chunk quiz</button>
          </div>
          {studyMode === "review" ? renderReview() : renderChunkQuiz()}
        </section>

        <aside className="side-panel right-panel">
          <p className="eyebrow">{studyMode === "review" ? "Today" : "Current chunk"}</p>
          {studyMode === "review" ? (
            <>
              <div className="stat"><strong>{reviewed}</strong><span>reviewed</span></div>
              <div className="stat"><strong>{accuracy}<sup>%</sup></strong><span>accuracy</span></div>
              <div className="stat"><strong>{seen}</strong><span>cards seen</span></div>
            </>
          ) : (
            <>
              <div className="stat"><strong>{chunkSession?.queue.length ?? 0}</strong><span>in queue</span></div>
              <div className="stat"><strong>{chunkSession?.stats.attempts ?? 0}</strong><span>attempts</span></div>
              <div className="stat"><strong>{chunkSession?.stats.halfPinyin ?? 0}</strong><span>tone reminders</span></div>
            </>
          )}
          <div className="ink-note"><span>记住</span><p>{studyMode === "review" ? "New cards appear most often. Cards you miss return more frequently." : "Clear the queue by translating every card correctly twice in a row."}</p></div>
        </aside>
      </section>

      <footer>
        <span>Section 1 · {allCards.length} unique vocabulary entries</span>
        <span>Made for deliberate practice</span>
      </footer>

      {factToast && (
        <aside className="fact-toast" role="status" aria-label="Character fact">
          <button onClick={() => setFactToast(null)} aria-label="Dismiss character fact">×</button>
          <p className="eyebrow">Character note</p>
          <h3>{factToast.label}</h3>
          <p>{factToast.text}</p>
          <div>
            {factToast.examples.map((example) => (
              <span key={example.hanzi}><b>{example.hanzi}</b><em>{example.pinyin}</em><small>{example.meaning}</small></span>
            ))}
          </div>
        </aside>
      )}

      {isLibraryOpen && (
        <div className="drawer-backdrop" onMouseDown={() => setIsLibraryOpen(false)}>
          <aside className="library-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="Vocabulary library">
            <div className="drawer-head">
              <div><p className="eyebrow">Full collection</p><h2>Vocabulary</h2></div>
              <button onClick={() => setIsLibraryOpen(false)} aria-label="Close vocabulary">×</button>
            </div>
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Hanzi, pinyin, or meaning…" />
            <div className="word-list">
              {libraryCards.map((card) => (
                <article key={card.id}>
                  <span className="word-hanzi">{card.chinese}</span>
                  <span><strong>{card.pinyin}</strong><small>{card.meanings.join(" · ")}</small></span>
                  <i>U{card.units.join(",")}</i>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
