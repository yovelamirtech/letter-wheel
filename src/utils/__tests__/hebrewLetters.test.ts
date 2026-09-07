import {
  normalizeFinalLetter,
  normalizeWordLetters,
  uniqueNormalizedLetters,
  toFinalFormAtEnd,
} from '../hebrewLetters';

describe('normalizeFinalLetter', () => {
  it('maps each final letter to its base form', () => {
    expect(normalizeFinalLetter('ך')).toBe('כ');
    expect(normalizeFinalLetter('ם')).toBe('מ');
    expect(normalizeFinalLetter('ן')).toBe('נ');
    expect(normalizeFinalLetter('ף')).toBe('פ');
    expect(normalizeFinalLetter('ץ')).toBe('צ');
  });

  it('returns non-final letters unchanged', () => {
    expect(normalizeFinalLetter('א')).toBe('א');
    expect(normalizeFinalLetter('כ')).toBe('כ');
  });
});

describe('normalizeWordLetters', () => {
  it('normalizes every final letter in a word', () => {
    expect(normalizeWordLetters('עולם')).toBe('עולמ');
  });

  it('leaves a word with no final letters unchanged', () => {
    expect(normalizeWordLetters('שלום'.slice(0, 3))).toBe('שלו');
  });
});

describe('uniqueNormalizedLetters', () => {
  it('returns the set of distinct normalized letters', () => {
    expect(uniqueNormalizedLetters('ממם')).toEqual(new Set(['מ']));
  });

  it('normalizes final letters before deduping', () => {
    expect(uniqueNormalizedLetters('עולם')).toEqual(new Set(['ע', 'ו', 'ל', 'מ']));
  });
});

describe('toFinalFormAtEnd', () => {
  it('converts a trailing base letter to its final form', () => {
    expect(toFinalFormAtEnd('עולמ')).toBe('עולם');
  });

  it('does not touch non-final trailing letters', () => {
    expect(toFinalFormAtEnd('שלום')).toBe('שלום');
  });

  it('only converts the last character, not occurrences mid-word', () => {
    expect(toFinalFormAtEnd('מכונת')).toBe('מכונת');
  });

  it('returns an empty string unchanged', () => {
    expect(toFinalFormAtEnd('')).toBe('');
  });
});
