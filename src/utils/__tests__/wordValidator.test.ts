import { PuzzleLetters } from '../../types';
import {
  buildDictionarySet,
  isPangram,
  normalizeWord,
  usesOnlyAvailableLetters,
  validateWord,
  MIN_WORD_LENGTH,
} from '../wordValidator';

describe('normalizeWord', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeWord('  שלום  ')).toBe('שלום');
  });
});

describe('buildDictionarySet', () => {
  it('normalizes every word when building the set', () => {
    const dict = buildDictionarySet(['  שלום  ', 'עולם']);
    expect(dict.has('שלום')).toBe(true);
    expect(dict.has('עולם')).toBe(true);
    expect(dict.size).toBe(2);
  });
});

describe('usesOnlyAvailableLetters', () => {
  const letters = ['א', 'ב', 'ג'];

  it('accepts a word made only from available letters', () => {
    expect(usesOnlyAvailableLetters('בג', letters)).toBe(true);
  });

  it('rejects a word using a letter not in the circle', () => {
    expect(usesOnlyAvailableLetters('בד', letters)).toBe(false);
  });

  it('rejects a word that reuses a letter more times than it appears', () => {
    expect(usesOnlyAvailableLetters('אא', letters)).toBe(false);
  });

  it('allows reuse when the letter appears multiple times in the circle', () => {
    expect(usesOnlyAvailableLetters('אא', ['א', 'א', 'ב'])).toBe(true);
  });

  it('normalizes final letters before checking availability', () => {
    // המילה 'עולם' מסתיימת ב-ם (סופית), אבל במעגל האותיות מוצגת רק 'מ'
    expect(usesOnlyAvailableLetters('עולם', ['ע', 'ו', 'ל', 'מ'])).toBe(true);
  });
});

describe('isPangram', () => {
  it('is true when the word uses every available letter', () => {
    expect(isPangram('אבג', ['א', 'ב', 'ג'])).toBe(true);
  });

  it('is false when a letter is missing', () => {
    expect(isPangram('אב', ['א', 'ב', 'ג'])).toBe(false);
  });

  it('normalizes final letters before comparing', () => {
    expect(isPangram('עולם', ['ע', 'ו', 'ל', 'מ'])).toBe(true);
  });
});

describe('validateWord', () => {
  const puzzle: PuzzleLetters = { letters: ['ש', 'ל', 'ו', 'מ'] };
  const dictionary = buildDictionarySet(['שלום']);

  it('rejects words shorter than MIN_WORD_LENGTH', () => {
    const result = validateWord('ש'.repeat(MIN_WORD_LENGTH - 1), puzzle, dictionary, new Set());
    expect(result).toEqual({ valid: false, reason: 'too_short' });
  });

  it('rejects a word missing the required letter', () => {
    const puzzleWithRequired: PuzzleLetters = { ...puzzle, requiredLetter: 'מ' };
    const result = validateWord('שלו' + 'שלו', puzzleWithRequired, dictionary, new Set());
    expect(result).toEqual({ valid: false, reason: 'missing_required_letter' });
  });

  it('rejects a word containing letters outside the circle', () => {
    const badDictionary = buildDictionarySet(['שלוד']);
    const result = validateWord('שלוד', puzzle, badDictionary, new Set());
    expect(result).toEqual({ valid: false, reason: 'invalid_letters' });
  });

  it('rejects a word already found', () => {
    const result = validateWord('שלום', puzzle, dictionary, new Set(['שלום']));
    expect(result).toEqual({ valid: false, reason: 'already_found' });
  });

  it('rejects a word not present in the dictionary', () => {
    const result = validateWord('מלוש', puzzle, dictionary, new Set());
    expect(result).toEqual({ valid: false, reason: 'not_in_dictionary' });
  });

  it('accepts a valid word', () => {
    const result = validateWord('שלום', puzzle, dictionary, new Set());
    expect(result).toEqual({ valid: true });
  });

  it('trims whitespace before validating', () => {
    const result = validateWord('  שלום  ', puzzle, dictionary, new Set());
    expect(result).toEqual({ valid: true });
  });
});
