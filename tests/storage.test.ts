import { JLyPair, pairKey } from '../app/utils/pairs';
import { parseCurrentSession, parseFailedWords, parseHighScores, topScores } from '../app/utils/storage';

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
