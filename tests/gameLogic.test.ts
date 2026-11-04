import {
  BACKLOG_INTERVAL,
  GameState,
  GREEN_THRESHOLD,
  initializeGameState,
  manualRemove,
  MASTERY_THRESHOLD,
  nextQuestion,
  REAPPEAR_THRESHOLD,
  resetGame,
  selectAnswer,
} from '../app/utils/gameLogic';
import { JLyPair, pairKey, sanitizePairs } from '../app/utils/pairs';

const folyo: JLyPair = { correct: 'folyó', wrong: 'fojó' };
const hajo: JLyPair = { correct: 'hajó', wrong: 'halyó' };
const hej: JLyPair = { correct: 'hej', wrong: 'hely', bothCorrect: true };
// Same correct word, two wrong variants: must be tracked separately.
const jaj1: JLyPair = { correct: 'jaj', wrong: 'lyaj' };
const jaj2: JLyPair = { correct: 'jaj', wrong: 'jaly' };
const PAIRS = [folyo, hajo, hej, jaj1, jaj2];

function withCurrent(state: GameState, pair: JLyPair): GameState {
  return { ...state, currentPair: pair, shuffledOptions: [pair.correct, pair.wrong], isAnswered: false, selectedAnswer: null };
}

function deepFreeze<T>(obj: T): T {
  Object.values(obj as object).forEach((v) => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(obj);
}

describe('initializeGameState', () => {
  it('rejects an empty pool instead of crashing later', () => {
    expect(() => initializeGameState([])).toThrow();
  });

  it('resets saved words to backlog while keeping their stats', () => {
    const saved = { [pairKey(folyo)]: { pair: folyo, stage: 'green' as const, gameIndexFailedAt: 40, consecutiveCorrect: 2, sessionCorrect: 3 } };
    const state = initializeGameState(PAIRS, saved);
    expect(state.failedWords[pairKey(folyo)]).toEqual({ pair: folyo, stage: 'backlog', gameIndexFailedAt: 0, consecutiveCorrect: 0, sessionCorrect: 3 });
    expect(state.shuffledOptions.sort()).toEqual([state.currentPair.correct, state.currentPair.wrong].sort());
  });
});

describe('selectAnswer', () => {
  it('scores a correct answer and ignores a second answer', () => {
    const s0 = withCurrent(initializeGameState(PAIRS), folyo);
    const s1 = selectAnswer(s0, 'folyó');
    expect([s1.correctAnswers, s1.totalAnswers, s1.isAnswered]).toEqual([1, 1, true]);
    expect(selectAnswer(s1, 'fojó')).toBe(s1);
  });

  it('accepts either option for bothCorrect pairs', () => {
    const s = selectAnswer(withCurrent(initializeGameState(PAIRS), hej), 'hely');
    expect(s.correctAnswers).toBe(1);
    expect(s.failedWords).toEqual({});
  });

  it('records a miss under the pair key, not the correct word', () => {
    const s = selectAnswer(withCurrent(initializeGameState(PAIRS), jaj1), 'lyaj');
    expect(Object.keys(s.failedWords)).toEqual(['jaj|lyaj']);
    expect(s.failedWords['jaj|lyaj'].stage).toBe('backlog');
  });

  it('never mutates the previous state', () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), folyo), 'fojó');
    s = deepFreeze(nextQuestion(s));
    // Throws in strict mode if selectAnswer writes into the frozen stat objects.
    expect(() => selectAnswer(withCurrent(s, folyo), 'folyó')).not.toThrow();
    expect(s.failedWords[pairKey(folyo)].consecutiveCorrect).toBe(0);
  });

  it(`turns green after ${GREEN_THRESHOLD} in a row and masters after ${MASTERY_THRESHOLD}`, () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), folyo), 'fojó');
    const stages: string[] = [];
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      s = selectAnswer(withCurrent(s, folyo), 'folyó');
      stages.push(s.failedWords[pairKey(folyo)]?.stage ?? 'mastered');
    }
    expect(stages).toEqual(['backlog', 'green', 'green', 'mastered']);
    expect(s.justMastered).toBe('folyó');
  });

  it('a miss resets progress back to backlog', () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), folyo), 'fojó');
    s = selectAnswer(withCurrent(s, folyo), 'folyó');
    s = selectAnswer(withCurrent(s, folyo), 'folyó');
    s = selectAnswer(withCurrent(s, folyo), 'fojó');
    expect(s.failedWords[pairKey(folyo)]).toMatchObject({ stage: 'backlog', consecutiveCorrect: 0, sessionCorrect: 0 });
  });
});

describe('nextQuestion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps failed pairs out of the random pool', () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), jaj1), 'lyaj');
    for (let i = 0; i < 200; i++) {
      s = nextQuestion({ ...s, totalAnswers: 1 }); // never a backlog slot
      expect(pairKey(s.currentPair)).not.toBe('jaj|lyaj');
    }
  });

  it('serves a cooled-down failed word in the backlog slot', () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), folyo), 'fojó');
    s = withCurrent(s, hajo);
    const slot = REAPPEAR_THRESHOLD * BACKLOG_INTERVAL - 1; // (slot + 1) % interval === 0, cooled down
    const next = nextQuestion({ ...s, isAnswered: true, totalAnswers: slot });
    expect(next.currentPair).toBe(folyo);
    expect(next.isCurrentFromBacklog).toBe(true);
  });

  it('does not serve a failed word before its cool-down', () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), folyo), 'fojó');
    s = withCurrent(s, hajo);
    const next = nextQuestion({ ...s, totalAnswers: BACKLOG_INTERVAL - 1 });
    expect(next.isCurrentFromBacklog).toBe(false);
  });

  it('never repeats the current pair when an alternative exists', () => {
    let s = withCurrent(initializeGameState(PAIRS), folyo);
    for (let i = 0; i < 100; i++) {
      const next = nextQuestion(s);
      expect(pairKey(next.currentPair)).not.toBe(pairKey(s.currentPair));
      s = next;
    }
  });
});

describe('manualRemove / resetGame', () => {
  it('removes by pair key and resets the score but keeps failed words', () => {
    let s = selectAnswer(withCurrent(initializeGameState(PAIRS), jaj1), 'lyaj');
    s = selectAnswer(withCurrent(s, jaj2), 'jaly');
    expect(Object.keys(manualRemove(s, 'jaj|lyaj').failedWords)).toEqual(['jaj|jaly']);
    const fresh = resetGame(s);
    expect([fresh.correctAnswers, fresh.totalAnswers]).toEqual([0, 0]);
    expect(Object.keys(fresh.failedWords).sort()).toEqual(['jaj|jaly', 'jaj|lyaj']);
  });
});

describe('sanitizePairs', () => {
  it('drops malformed and over-long pairs and normalises the flag', () => {
    const out = sanitizePairs([
      folyo,
      { correct: 'a', wrong: 'a' },
      { correct: 'nagyonhosszúszóvagyok', wrong: 'x' },
      { correct: 5, wrong: 'x' },
      null,
      { correct: 'hej', wrong: 'hely', bothCorrect: true },
      { correct: 'baj', wrong: 'baly', bothCorrect: false },
    ]);
    expect(out).toEqual([folyo, { correct: 'hej', wrong: 'hely', bothCorrect: true }, { correct: 'baj', wrong: 'baly' }]);
    expect(sanitizePairs({ not: 'an array' })).toEqual([]);
  });
});
