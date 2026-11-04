import { JLyPair, pairKey } from '../app/utils/pairs';
import { parseCurrentSession, parseFailedWords, parseHighScores, rankScores, topScores } from '../app/utils/storage';
import { wordSizeStep } from '../app/utils/display';

const folyo: JLyPair = { correct: 'folyó', wrong: 'fojó' };
const jaj1: JLyPair = { correct: 'jaj', wrong: 'lyaj' };
const known = new Map([folyo, jaj1].map((p) => [pairKey(p), p]));

describe('parseFailedWords', () => {
  it('migrates a v1 record (keyed by correct word) to the pair key', () => {
    const v1 = JSON.stringify({
      'folyó': { pair: folyo, stage: 'green', gameIndexFailedAt: 3, consecutiveCorrect: 2, sessionCorrect: 2 },
    });
    expect(parseFailedWords(v1, known)).toEqual({
      'folyó|fojó': { pair: folyo, stage: 'green', gameIndexFailedAt: 3, consecutiveCorrect: 2, sessionCorrect: 2 },
    });
  });

  it('re-points records at the canonical pair object', () => {
    const raw = JSON.stringify({ x: { pair: { ...folyo, extra: 'junk' }, stage: 'backlog' } });
    expect(parseFailedWords(raw, known)['folyó|fojó'].pair).toBe(folyo);
  });

  it('drops malformed records and repairs bad fields instead of throwing', () => {
    const raw = JSON.stringify({
      a: null,
      b: { stage: 'backlog' },
      c: { pair: { correct: 1, wrong: 2 } },
      d: { pair: { correct: 'nincs', wrong: 'ilyen' } }, // not in the dataset
      e: { pair: jaj1, stage: 'mastered', gameIndexFailedAt: -4, consecutiveCorrect: 'x', sessionCorrect: 1.5 },
    });
    expect(parseFailedWords(raw, known)).toEqual({
      'jaj|lyaj': { pair: jaj1, stage: 'backlog', gameIndexFailedAt: 0, consecutiveCorrect: 0, sessionCorrect: 0 },
    });
  });

  it.each([null, '', 'not json', '[1,2]', '"str"', '42'])('treats %p as empty', (raw) => {
    expect(parseFailedWords(raw, known)).toEqual({});
  });
});

describe('high scores', () => {
  it('keeps the best three, highest first, without zeros', () => {
    expect(topScores([3, 0, 12, 7, 9])).toEqual([12, 9, 7]);
    expect(topScores([0])).toEqual([]);
  });

  it('ranks the running session among the saved scores and marks it', () => {
    expect(rankScores([24, 19, 9], 12)).toEqual([
      { score: 24, isCurrent: false },
      { score: 19, isCurrent: false },
      { score: 12, isCurrent: true },
    ]);
    // Not in the top three yet, or still zero: not listed.
    expect(rankScores([24, 19, 9], 5).some((e) => e.isCurrent)).toBe(false);
    expect(rankScores([], 0)).toEqual([]);
    // A tie keeps the finished session ahead.
    expect(rankScores([9], 9)).toEqual([{ score: 9, isCurrent: false }, { score: 9, isCurrent: true }]);
  });

  it('parses defensively', () => {
    expect(parseHighScores('[5, "7", 2.5, -1, 3, 9, 1]')).toEqual([9, 5, 3]);
    expect(parseHighScores('{"a":1}')).toEqual([]);
    expect(parseHighScores(null)).toEqual([]);
  });

  it('reads the running session score', () => {
    expect(parseCurrentSession('{"score":14}')).toBe(14);
    expect(parseCurrentSession('{"score":"14"}')).toBe(0);
    expect(parseCurrentSession('oops')).toBe(0);
    expect(parseCurrentSession(null)).toBe(0);
  });
});

describe('wordSizeStep', () => {
  it('steps the answer type size down with the longer option', () => {
    expect([3, 9, 10, 12, 13, 14, 15, 20].map(wordSizeStep)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});
