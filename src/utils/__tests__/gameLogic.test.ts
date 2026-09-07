import { PuzzleLetters } from '../../types';
import { buildDictionarySet } from '../wordValidator';
import { calculateScore, createInitialState, restoreState, submitWord } from '../gameLogic';

const puzzle: PuzzleLetters = { letters: ['ש', 'ל', 'ו', 'מ'] };

describe('calculateScore', () => {
  it('gives 1 point for a 2-letter word', () => {
    expect(calculateScore('שם', puzzle)).toBe(1);
  });

  it('gives 1 point per letter for longer words', () => {
    expect(calculateScore('שלו', puzzle)).toBe(3);
  });

  it('adds the pangram bonus when the word uses all available letters', () => {
    expect(calculateScore('שלום', puzzle)).toBe(4 + 7);
  });
});

describe('createInitialState', () => {
  it('starts with no found words and zero score', () => {
    const state = createInitialState(puzzle);
    expect(state).toEqual({
      puzzle,
      foundWords: [],
      totalScore: 0,
      currentInput: '',
    });
  });
});

describe('restoreState', () => {
  it('recomputes scores and pangram status from the word list alone', () => {
    const state = restoreState(puzzle, ['שם', 'שלום']);
    expect(state.foundWords).toEqual([
      { word: 'שם', score: 1, isPangram: false },
      { word: 'שלום', score: 11, isPangram: true },
    ]);
    expect(state.totalScore).toBe(12);
    expect(state.currentInput).toBe('');
  });

  it('produces an empty state for an empty word list', () => {
    const state = restoreState(puzzle, []);
    expect(state.foundWords).toEqual([]);
    expect(state.totalScore).toBe(0);
  });
});

describe('submitWord', () => {
  const dictionary = buildDictionarySet(['שלום', 'שם']);

  it('accepts a valid word, updates score and clears input', () => {
    const state = { ...createInitialState(puzzle), currentInput: 'שלום' };
    const result = submitWord(state, dictionary);

    expect(result.success).toBe(true);
    expect(result.state.currentInput).toBe('');
    expect(result.state.totalScore).toBe(11);
    expect(result.state.foundWords).toEqual([{ word: 'שלום', score: 11, isPangram: true }]);
    expect(result.message).toContain('פנגרם');
  });

  it('does not mutate the original state on success', () => {
    const state = { ...createInitialState(puzzle), currentInput: 'שם' };
    submitWord(state, dictionary);
    expect(state.foundWords).toEqual([]);
    expect(state.totalScore).toBe(0);
  });

  it('rejects a word that is not in the dictionary and clears input', () => {
    const state = { ...createInitialState(puzzle), currentInput: 'מלוש' };
    const result = submitWord(state, dictionary);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('not_in_dictionary');
    expect(result.state.currentInput).toBe('');
    expect(result.state.foundWords).toEqual([]);
  });

  it('rejects a word already found, without double-counting score', () => {
    const withFoundWord = {
      ...createInitialState(puzzle),
      foundWords: [{ word: 'שם', score: 1, isPangram: false }],
      totalScore: 1,
      currentInput: 'שם',
    };
    const result = submitWord(withFoundWord, dictionary);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_found');
    expect(result.state.totalScore).toBe(1);
    expect(result.state.foundWords).toHaveLength(1);
  });

  it('reports the missing required letter reason with a matching message', () => {
    const puzzleWithRequired: PuzzleLetters = { ...puzzle, requiredLetter: 'ם' };
    const state = { ...createInitialState(puzzleWithRequired), currentInput: 'שם' };
    const localDictionary = buildDictionarySet(['שם']);
    // 'שם' contains ם, so pick a word from the same letters lacking it instead
    const noRequiredLetterState = { ...state, currentInput: 'של' };
    const result = submitWord(noRequiredLetterState, localDictionary);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('missing_required_letter');
    expect(result.message).toBe('חסרה האות החובה');
  });
});
