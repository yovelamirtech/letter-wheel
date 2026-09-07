import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addFoundWordToProgress,
  clearProgress,
  getFoundWordsForLevel,
  loadProgress,
  saveProgress,
} from '../progress';
import { StoredProgress } from '../../types';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('loadProgress', () => {
  it('returns empty progress when nothing is stored', async () => {
    const progress = await loadProgress();
    expect(progress).toEqual({ totalScore: 0, foundWordsByLevel: {} });
  });

  it('returns previously saved progress', async () => {
    const saved: StoredProgress = { totalScore: 5, foundWordsByLevel: { '0': ['שלום'] } };
    await saveProgress(saved);
    const progress = await loadProgress();
    expect(progress).toEqual(saved);
  });

  it('falls back to defaults for a malformed stored value', async () => {
    await AsyncStorage.setItem('hebrew-word-game:progress:v1', 'not json');
    const progress = await loadProgress();
    expect(progress).toEqual({ totalScore: 0, foundWordsByLevel: {} });
  });

  it('fills in missing fields from a partial stored value', async () => {
    await AsyncStorage.setItem('hebrew-word-game:progress:v1', JSON.stringify({ totalScore: 3 }));
    const progress = await loadProgress();
    expect(progress).toEqual({ totalScore: 3, foundWordsByLevel: {} });
  });
});

describe('clearProgress', () => {
  it('removes previously stored progress', async () => {
    await saveProgress({ totalScore: 5, foundWordsByLevel: {} });
    await clearProgress();
    const progress = await loadProgress();
    expect(progress).toEqual({ totalScore: 0, foundWordsByLevel: {} });
  });
});

describe('addFoundWordToProgress', () => {
  const empty: StoredProgress = { totalScore: 0, foundWordsByLevel: {} };

  it('adds a new word and increases the total score', () => {
    const next = addFoundWordToProgress(empty, 0, 'שלום', 11);
    expect(next).toEqual({ totalScore: 11, foundWordsByLevel: { '0': ['שלום'] } });
  });

  it('does not double-count a word already recorded for that level', () => {
    const withWord: StoredProgress = { totalScore: 11, foundWordsByLevel: { '0': ['שלום'] } };
    const next = addFoundWordToProgress(withWord, 0, 'שלום', 11);
    expect(next).toEqual(withWord);
  });

  it('keeps separate word lists per level', () => {
    const afterLevel0 = addFoundWordToProgress(empty, 0, 'שלום', 11);
    const afterLevel1 = addFoundWordToProgress(afterLevel0, 1, 'שם', 1);
    expect(afterLevel1).toEqual({
      totalScore: 12,
      foundWordsByLevel: { '0': ['שלום'], '1': ['שם'] },
    });
  });

  it('does not mutate the input progress object', () => {
    const before = JSON.parse(JSON.stringify(empty));
    addFoundWordToProgress(empty, 0, 'שלום', 11);
    expect(empty).toEqual(before);
  });
});

describe('getFoundWordsForLevel', () => {
  it('returns the words found for a given level', () => {
    const progress: StoredProgress = { totalScore: 11, foundWordsByLevel: { '0': ['שלום'] } };
    expect(getFoundWordsForLevel(progress, 0)).toEqual(['שלום']);
  });

  it('returns an empty array for a level with no recorded words', () => {
    const progress: StoredProgress = { totalScore: 0, foundWordsByLevel: {} };
    expect(getFoundWordsForLevel(progress, 3)).toEqual([]);
  });
});
